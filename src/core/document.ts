import type {
  Block,
  NormalizedDocument,
  PausePunctuation,
  RawBlock,
  Sentence,
  Token,
  TokenKind,
  Word,
} from './model';
import { normalizeText } from './normalize';
import { getSegmenter, type Segmenter } from './segmentation';

export interface BuildDocumentOptions {
  /** Langue BCP 47 utilisée pour la segmentation. Défaut : `fr`. */
  locale?: string;
  /** Force une stratégie de segmentation (tests, compatibilité). */
  segmentation?: 'intl' | 'fallback';
  /**
   * Au-delà de ce nombre de lettres, un mot est découpé en segments
   * équilibrés d'au plus 16 lettres (affichés avec un trait d'union) pour
   * rester lisible sur écran étroit. Défaut : 25 (min. 12).
   */
  maxWordLength?: number;
}

/** Taille cible des segments d'un mot trop long. */
const WORD_PIECE = 16;

/** Séparateur inséré entre deux blocs dans `NormalizedDocument.text`. */
export const BLOCK_SEPARATOR = '\n\n';

const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
const LETTER = /\p{L}/u;
const PUNCT = /\p{P}/u;
const OPENING = /^[\p{Ps}\p{Pi}«‹„‚¿¡"'\s]+$/u;
const SENTENCE_END = /[.!?…‼⁇⁈⁉。！？]/u;
const CLAUSE_END = /[;:—–;:]/u;
const COMMA_END = /[,،、，]/u;
const NARROW_SPACE = /^[\u{A0}\u{202F}\u{2007}\u{2009}]$/u;
const DIGITS = /^\p{N}+$/u;
const DIGIT_GROUP = /^\p{N}{3}$/u;
// Écritures sans espaces entre les mots : chaque segment lexical devient un mot de lecture.
const SPACELESS_SCRIPT = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;

/** Abréviations sensibles à la casse (formes capitalisées). */
const ABBREVIATIONS_CASED = new Set([
  'M', 'MM', 'Mme', 'Mmes', 'Mlle', 'Mlles', 'Me', 'Mgr', 'Dr', 'Pr', 'St', 'Ste',
  'Mr', 'Mrs', 'Ms', 'Prof', 'Sr', 'Jr', 'Inc', 'Ltd', 'Corp', 'Co', 'Gen', 'Gov',
  'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  'Fig', 'Vol', 'No', 'Ch', 'Dept', 'Av', 'Bd',
]);
/** Abréviations insensibles à la casse. */
const ABBREVIATIONS = new Set([
  'cf', 'etc', 'ex', 'p', 'pp', 'env', 'av', 'apr', 'éd', 'vol', 'chap', 'fig', 'tél',
  'coll', 'ibid', 'op', 'cit', 'vs', 'resp', 'réf', 'e.g', 'i.e', 'approx', 'dept',
  'j.-c', 'a.m', 'p.m', 'ph.d', 'u.s', 'u.k', 'al', 'éds', 'n.b', 'c.-à-d', 'p.ex',
]);
/** Abréviations pouvant aussi clore une phrase si le mot suivant est capitalisé. */
const TERMINAL_ABBREVIATIONS = new Set(['etc', 'al']);

interface Chunk {
  tokenStart: number;
  tokenEnd: number;
  /** Segment non final d'un mot trop long. */
  continues?: boolean;
}

function balancedSize(length: number): number {
  return Math.ceil(length / Math.ceil(length / WORD_PIECE));
}

/** Token en cours de construction, avant attribution des index globaux. */
interface DraftToken {
  kind: TokenKind;
  text: string;
  /** Offset dans le bloc. */
  offset: number;
  /** Nombre de graphèmes lettres/chiffres. */
  letters: number;
}

/** Découpe un token lexical en morceaux d'au plus `size` lettres (équilibrés). */
function splitDraft(t: DraftToken, size: number, segmenter: Segmenter): DraftToken[] {
  const pieces = Math.ceil(t.letters / size);
  const per = Math.ceil(t.letters / pieces);
  const out: DraftToken[] = [];
  let text = '';
  let letters = 0;
  let offset = t.offset;
  for (const g of segmenter.graphemes(t.text)) {
    const isLetter = LETTER_OR_DIGIT.test(g);
    if (isLetter && letters === per) {
      out.push({ kind: t.kind, text, offset, letters });
      offset += text.length;
      text = '';
      letters = 0;
    }
    text += g;
    if (isLetter) letters++;
  }
  if (text) out.push({ kind: t.kind, text, offset, letters });
  return out;
}

/**
 * Découpe un mot de lecture trop long (> `max` lettres) en segments d'au plus
 * `balancedSize(total)` ≤ 16 lettres. Les frontières de tokens (traits
 * d'union, apostrophes) sont utilisées en priorité ; un token plus long que
 * la taille cible est lui-même découpé, afin de garantir la borne.
 */
function splitLongChunk(drafts: DraftToken[], max: number, segmenter: Segmenter): { drafts: DraftToken[]; continues: boolean }[] {
  const total = drafts.reduce((n, t) => n + t.letters, 0);
  if (total <= max) return [{ drafts, continues: false }];
  const target = balancedSize(total);
  const expanded = drafts.flatMap((t) => (t.letters > target ? splitDraft(t, target, segmenter) : [t]));
  const out: { drafts: DraftToken[]; continues: boolean }[] = [];
  let current: DraftToken[] = [];
  let count = 0;
  for (const t of expanded) {
    if (t.letters > 0 && count > 0 && count + t.letters > target) {
      out.push({ drafts: current, continues: true });
      current = [];
      count = 0;
    }
    current.push(t);
    count += t.letters;
  }
  out.push({ drafts: current, continues: false });
  return out;
}

function toDraft(t: Token, letters: number): DraftToken {
  return { kind: t.kind, text: t.text, offset: t.start, letters };
}

function tokenKind(segment: string, isWordLike: boolean): TokenKind {
  if (/^\s+$/u.test(segment)) return 'space';
  if (isWordLike || LETTER_OR_DIGIT.test(segment)) return LETTER.test(segment) ? 'word' : 'number';
  return PUNCT.test(segment) ? 'punct' : 'symbol';
}

function isLexical(t: Token): boolean {
  return t.kind === 'word' || t.kind === 'number';
}

/** Découpe les tokens d'un bloc en mots de lecture. */
function chunkBlock(tokens: Token[], from: number, to: number): Chunk[] {
  // 1. Groupes séparés par des espaces.
  const raw: Chunk[] = [];
  let start = -1;
  for (let i = from; i < to; i++) {
    const t = tokens[i]!;
    if (t.kind === 'space') {
      if (start >= 0) raw.push({ tokenStart: start, tokenEnd: i });
      start = -1;
    } else if (start < 0) start = i;
  }
  if (start >= 0) raw.push({ tokenStart: start, tokenEnd: to });

  // 2. Nombres à séparateur de milliers insécable : « 1 000 000 ».
  const merged: Chunk[] = [];
  for (const c of raw) {
    const prev = merged[merged.length - 1];
    if (prev && prev.tokenEnd === c.tokenStart - 1) {
      const space = tokens[prev.tokenEnd]!;
      const last = tokens[prev.tokenEnd - 1]!;
      const first = tokens[c.tokenStart]!;
      if (NARROW_SPACE.test(space.text) && DIGITS.test(last.text) && DIGIT_GROUP.test(first.text)) {
        prev.tokenEnd = c.tokenEnd;
        continue;
      }
    }
    merged.push({ ...c });
  }

  // 3. Écritures sans espaces : un mot de lecture par segment lexical.
  const split: Chunk[] = [];
  for (const c of merged) {
    let lexical = 0;
    let spaceless = false;
    for (let i = c.tokenStart; i < c.tokenEnd; i++) {
      const t = tokens[i]!;
      if (isLexical(t)) lexical++;
      if (SPACELESS_SCRIPT.test(t.text)) spaceless = true;
    }
    if (lexical > 1 && spaceless) {
      for (let i = c.tokenStart; i < c.tokenEnd; i++) split.push({ tokenStart: i, tokenEnd: i + 1 });
    } else split.push(c);
  }

  // 4. Rattachement des groupes sans lettres ni chiffres (ponctuation isolée,
  //    guillemets français, symboles) au mot précédent ou suivant.
  const hasLexical = (c: Chunk) => {
    for (let i = c.tokenStart; i < c.tokenEnd; i++) if (isLexical(tokens[i]!)) return true;
    return false;
  };
  // Présence d'un groupe lexical après l'indice k (précalculée : parcours linéaire).
  const lexicalAfter = new Array<boolean>(split.length + 1).fill(false);
  for (let k = split.length - 1; k >= 0; k--) lexicalAfter[k] = lexicalAfter[k + 1]! || hasLexical(split[k]!);
  const result: Chunk[] = [];
  let pendingOpen: Chunk | null = null;
  for (let k = 0; k < split.length; k++) {
    const c = split[k]!;
    if (hasLexical(c)) {
      if (pendingOpen) {
        c.tokenStart = pendingOpen.tokenStart;
        pendingOpen = null;
      }
      result.push(c);
      continue;
    }
    const text = tokens
      .slice(c.tokenStart, c.tokenEnd)
      .map((t) => t.text)
      .join('');
    const prev = result[result.length - 1];
    const hasNext = lexicalAfter[k + 1]!;
    if (pendingOpen) {
      pendingOpen.tokenEnd = c.tokenEnd;
    } else if ((OPENING.test(text) && hasNext) || (!prev && hasNext)) {
      pendingOpen = { ...c };
    } else if (prev) {
      prev.tokenEnd = c.tokenEnd;
    } else {
      // Bloc sans aucun mot : le groupe devient son propre mot.
      result.push(c);
    }
  }
  if (pendingOpen) {
    const prev = result[result.length - 1];
    if (prev) prev.tokenEnd = pendingOpen.tokenEnd;
    else result.push(pendingOpen);
  }
  return result;
}

function trailingPunctuation(tokens: Token[], c: Chunk): { punctuation: PausePunctuation; trailing: string } {
  let lastLexical = -1;
  for (let i = c.tokenStart; i < c.tokenEnd; i++) if (isLexical(tokens[i]!)) lastLexical = i;
  const from = lastLexical < 0 ? c.tokenStart : lastLexical + 1;
  let trailing = '';
  for (let i = from; i < c.tokenEnd; i++) trailing += tokens[i]!.text;
  let punctuation: PausePunctuation = 'none';
  if (SENTENCE_END.test(trailing)) punctuation = 'sentence';
  else if (CLAUSE_END.test(trailing)) punctuation = 'clause';
  else if (COMMA_END.test(trailing)) punctuation = 'comma';
  return { punctuation, trailing };
}

/** Partie lexicale d'un mot se terminant par un point, sans ce point. */
function abbreviationCore(text: string): string | null {
  const stripped = text.replace(/^[\p{Ps}\p{Pi}«"'\s]+/u, '').replace(/[\p{Pe}\p{Pf}»"'\s]+$/u, '');
  if (!stripped.endsWith('.') || stripped.endsWith('..')) return null;
  return stripped.slice(0, -1);
}

function startsLowercase(text: string): boolean {
  const m = /[\p{L}\p{N}]/u.exec(text);
  return !!m && /\p{Ll}/u.test(m[0]);
}

function startsUppercase(text: string): boolean {
  const m = /[\p{L}\p{N}]/u.exec(text);
  return !!m && /\p{Lu}/u.test(m[0]);
}

type AbbreviationKind = 'no' | 'yes' | 'terminal';

function abbreviationKind(text: string): AbbreviationKind {
  const core = abbreviationCore(text);
  if (core === null || core.length === 0) return 'no';
  const lower = core.toLowerCase();
  if (TERMINAL_ABBREVIATIONS.has(lower)) return 'terminal';
  if (ABBREVIATIONS_CASED.has(core) || ABBREVIATIONS.has(lower)) return 'yes';
  // Initiale (« J. ») ou sigle pointé (« U.S.A. », « J.-C. »).
  if (/^\p{Lu}$/u.test(core) || /^(?:\p{L}[.-]+)+\p{L}$/u.test(core)) return 'yes';
  return 'no';
}

/**
 * Construit le modèle normalisé à partir de blocs bruts. Fonction pure et
 * déterministe : un même contenu produit toujours les mêmes index.
 */
export function buildDocument(rawBlocks: readonly RawBlock[], options: BuildDocumentOptions = {}): NormalizedDocument {
  const locale = options.locale ?? 'fr';
  const maxWordLength = Math.max(12, Math.floor(options.maxWordLength ?? 25));
  const segmenter: Segmenter = getSegmenter(locale, options.segmentation);

  const blocks: Block[] = [];
  const sentences: Sentence[] = [];
  const tokens: Token[] = [];
  const words: Word[] = [];
  let text = '';

  for (const raw of rawBlocks) {
    const blockText = normalizeText(raw.text);
    if (blockText.length === 0) continue;
    if (text.length > 0) text += BLOCK_SEPARATOR;
    const blockStart = text.length;
    text += blockText;
    const blockIndex = blocks.length;

    // Tokens provisoires du bloc (offsets locaux), puis mots de lecture.
    const drafts: Token[] = [];
    const draftLetters: number[] = [];
    for (const seg of segmenter.words(blockText)) {
      const kind = tokenKind(seg.segment, seg.isWordLike);
      let letters = 0;
      if (kind === 'word' || kind === 'number') for (const g of segmenter.graphemes(seg.segment)) if (LETTER_OR_DIGIT.test(g)) letters++;
      drafts.push({ index: drafts.length, kind, text: seg.segment, start: seg.index, end: seg.index + seg.segment.length, blockIndex });
      draftLetters.push(letters);
    }

    // Tokens définitifs : les mots trop longs sont découpés (et leurs tokens si nécessaire).
    const tokenFrom = tokens.length;
    const chunks: Chunk[] = [];
    const pushDraft = (d: DraftToken) => {
      tokens.push({ index: tokens.length, kind: d.kind, text: d.text, start: blockStart + d.offset, end: blockStart + d.offset + d.text.length, blockIndex });
    };
    let cursor = 0;
    for (const c of chunkBlock(drafts, 0, drafts.length)) {
      // Espaces entre deux mots de lecture.
      for (; cursor < c.tokenStart; cursor++) pushDraft(toDraft(drafts[cursor]!, draftLetters[cursor]!));
      const own: DraftToken[] = [];
      for (let i = c.tokenStart; i < c.tokenEnd; i++) own.push(toDraft(drafts[i]!, draftLetters[i]!));
      cursor = c.tokenEnd;
      for (const part of splitLongChunk(own, maxWordLength, segmenter)) {
        const start = tokens.length;
        part.drafts.forEach(pushDraft);
        chunks.push(part.continues ? { tokenStart: start, tokenEnd: tokens.length, continues: true } : { tokenStart: start, tokenEnd: tokens.length });
      }
    }
    for (; cursor < drafts.length; cursor++) pushDraft(toDraft(drafts[cursor]!, draftLetters[cursor]!));

    const wordFrom = words.length;
    for (const c of chunks) {
      const start = tokens[c.tokenStart]!.start;
      const end = tokens[c.tokenEnd - 1]!.end;
      const wordText = text.slice(start, end);
      const punctuation = c.continues ? 'none' : trailingPunctuation(tokens, c).punctuation;
      let letterCount = 0;
      for (const g of segmenter.graphemes(wordText)) if (LETTER_OR_DIGIT.test(g)) letterCount++;
      const index = words.length;
      for (let i = c.tokenStart; i < c.tokenEnd; i++) {
        if (tokens[i]!.kind !== 'space') tokens[i]!.wordIndex = index;
      }
      words.push({
        index,
        text: wordText,
        start,
        end,
        blockIndex,
        sentenceIndex: -1,
        tokenStart: c.tokenStart,
        tokenEnd: c.tokenEnd,
        letterCount,
        punctuation,
        endsSentence: false,
        endsBlock: false,
        continues: c.continues === true,
      });
    }
    const wordTo = words.length;
    if (wordTo === wordFrom) {
      // Bloc sans mot exploitable : on retire son texte.
      text = text.slice(0, blockStart > 0 ? blockStart - BLOCK_SEPARATOR.length : 0);
      tokens.length = tokenFrom;
      continue;
    }

    // Frontières de phrases.
    const sentenceFrom = sentences.length;
    let sentenceWordStart = wordFrom;
    for (let i = wordFrom; i < wordTo; i++) {
      const w = words[i]!;
      const next = i + 1 < wordTo ? words[i + 1]! : undefined;
      let ends = false;
      if (!next) {
        ends = true;
        w.endsBlock = true;
      } else if (w.punctuation === 'sentence') {
        const abbr = /[.]['"’”»)\]\s]*$/u.test(w.text) && !/[!?…]/u.test(w.text) ? abbreviationKind(w.text) : 'no';
        if (abbr === 'yes' || (abbr === 'terminal' && !startsUppercase(next.text))) {
          w.punctuation = 'none';
        } else if (startsLowercase(next.text)) {
          w.punctuation = 'comma';
        } else {
          ends = true;
        }
      }
      if (ends) {
        w.endsSentence = true;
        const sIndex = sentences.length;
        sentences.push({
          index: sIndex,
          blockIndex,
          start: words[sentenceWordStart]!.start,
          end: w.end,
          wordStart: sentenceWordStart,
          wordEnd: i + 1,
        });
        for (let j = sentenceWordStart; j <= i; j++) words[j]!.sentenceIndex = sIndex;
        sentenceWordStart = i + 1;
      }
    }

    blocks.push({
      index: blockIndex,
      kind: raw.kind,
      ...(raw.kind === 'heading' ? { level: Math.min(6, Math.max(1, raw.level ?? 2)) } : {}),
      start: blockStart,
      end: text.length,
      sentenceStart: sentenceFrom,
      sentenceEnd: sentences.length,
      wordStart: wordFrom,
      wordEnd: wordTo,
    });
  }

  return { text, locale, blocks, sentences, tokens, words, segmentation: segmenter.kind };
}

/** Position du mot contenant (ou suivant) l'offset donné dans le texte normalisé. */
export function wordIndexAtOffset(doc: NormalizedDocument, offset: number): number {
  const { words } = doc;
  if (words.length === 0) return -1;
  let lo = 0;
  let hi = words.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (words[mid]!.end <= offset) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
