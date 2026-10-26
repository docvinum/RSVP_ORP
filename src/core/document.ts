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

/** Découpe un mot de lecture trop long en segments, aux frontières de tokens. */
function splitLongChunk(tokens: Token[], c: Chunk, letters: (t: Token) => number, max: number): Chunk[] {
  let total = 0;
  for (let i = c.tokenStart; i < c.tokenEnd; i++) total += letters(tokens[i]!);
  if (total <= max) return [c];
  const target = balancedSize(total);
  const out: Chunk[] = [];
  let start = c.tokenStart;
  let count = 0;
  for (let i = c.tokenStart; i < c.tokenEnd; i++) {
    const n = letters(tokens[i]!);
    if (n > 0 && count > 0 && count + n > target) {
      out.push({ tokenStart: start, tokenEnd: i, continues: true });
      start = i;
      count = 0;
    }
    count += n;
  }
  out.push({ tokenStart: start, tokenEnd: c.tokenEnd });
  return out;
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
    const hasNext = split.slice(k + 1).some(hasLexical);
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

    const tokenFrom = tokens.length;
    const letterCounts = new Map<Token, number>();
    const pushToken = (kind: TokenKind, segment: string, offset: number, letterCount: number) => {
      const token: Token = { index: tokens.length, kind, text: segment, start: blockStart + offset, end: blockStart + offset + segment.length, blockIndex };
      tokens.push(token);
      letterCounts.set(token, letterCount);
    };
    for (const seg of segmenter.words(blockText)) {
      const kind = tokenKind(seg.segment, seg.isWordLike);
      if (kind !== 'word' && kind !== 'number') {
        pushToken(kind, seg.segment, seg.index, 0);
        continue;
      }
      const graphemes = segmenter.graphemes(seg.segment);
      const count = graphemes.filter((g) => LETTER_OR_DIGIT.test(g)).length;
      if (count <= maxWordLength) {
        pushToken(kind, seg.segment, seg.index, count);
        continue;
      }
      // Segment lexical trop long : découpé en morceaux équilibrés.
      const size = balancedSize(graphemes.length);
      let offset = seg.index;
      for (let i = 0; i < graphemes.length; i += size) {
        const piece = graphemes.slice(i, i + size).join('');
        pushToken(kind, piece, offset, piece.length > 0 ? [...segmenter.graphemes(piece)].filter((g) => LETTER_OR_DIGIT.test(g)).length : 0);
        offset += piece.length;
      }
    }
    const tokenTo = tokens.length;

    const chunks = chunkBlock(tokens, tokenFrom, tokenTo).flatMap((c) => splitLongChunk(tokens, c, (t) => letterCounts.get(t) ?? 0, maxWordLength));
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
