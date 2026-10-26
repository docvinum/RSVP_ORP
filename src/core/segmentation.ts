/**
 * Segmentation Unicode.
 *
 * Stratégie : `Intl.Segmenter` est utilisé lorsqu'il est disponible (graphèmes
 * et segments lexicaux). Sinon, un repli à base d'expressions régulières
 * Unicode (`\p{…}`) est utilisé. Le repli gère les marques combinantes, les
 * séquences ZWJ, les sélecteurs de variante et les paires d'indicateurs
 * régionaux, mais ne couvre pas toutes les règles UAX #29 (voir
 * docs/limitations.md). Aucune dépendance au DOM.
 */

export interface WordSegment {
  segment: string;
  index: number;
  isWordLike: boolean;
}

export interface Segmenter {
  readonly kind: 'intl' | 'fallback';
  graphemes(text: string): string[];
  words(text: string): WordSegment[];
}

type IntlSegmenterCtor = new (
  locale?: string,
  options?: { granularity: 'grapheme' | 'word' | 'sentence' },
) => {
  segment(input: string): Iterable<{ segment: string; index: number; isWordLike?: boolean }>;
};

function getIntlSegmenter(): IntlSegmenterCtor | undefined {
  const intl = (globalThis as { Intl?: { Segmenter?: IntlSegmenterCtor } }).Intl;
  return typeof intl?.Segmenter === 'function' ? intl.Segmenter : undefined;
}

// Graphème approximé : indicateurs régionaux appariés, ou base suivie de
// marques combinantes / sélecteurs de variante / modificateurs, éventuellement
// enchaînée par ZWJ.
const GRAPHEME_FALLBACK =
  // eslint-disable-next-line no-misleading-character-class -- classes de marques combinantes volontaires
  /\p{RI}\p{RI}|(?:\r\n)|(?:[^\p{M}\u{200D}\u{FE00}-\u{FE0F}](?:[\p{M}\u{FE00}-\u{FE0F}]|\p{Emoji_Modifier})*(?:\u{200D}[^\p{M}\u{200D}](?:[\p{M}\u{FE00}-\u{FE0F}]|\p{Emoji_Modifier})*)*)|[\s\S]/gu;

// Segment lexical approximé : lettres/chiffres avec apostrophes, tirets et
// séparateurs numériques internes ; sinon espaces ; sinon un graphème isolé.
const WORD_FALLBACK =
  /[\p{L}\p{M}\p{N}_]+(?:['’.,\-‐][\p{L}\p{M}\p{N}_]+)*|\s+|\p{RI}\p{RI}|[^\p{M}](?:\p{M}|\u{FE0F}|\u{200D}[^\s])*|[\s\S]/gu;
const HAS_WORD_CHAR = /[\p{L}\p{N}]/u;

export function createFallbackSegmenter(): Segmenter {
  return {
    kind: 'fallback',
    graphemes(text) {
      return text.match(GRAPHEME_FALLBACK) ?? [];
    },
    words(text) {
      const out: WordSegment[] = [];
      for (const m of text.matchAll(WORD_FALLBACK)) {
        out.push({ segment: m[0], index: m.index, isWordLike: HAS_WORD_CHAR.test(m[0]) });
      }
      return out;
    },
  };
}

export function createIntlSegmenter(locale: string): Segmenter | undefined {
  const Ctor = getIntlSegmenter();
  if (!Ctor) return undefined;
  let graphemeSeg;
  let wordSeg;
  try {
    graphemeSeg = new Ctor(locale, { granularity: 'grapheme' });
    wordSeg = new Ctor(locale, { granularity: 'word' });
  } catch {
    return undefined;
  }
  return {
    kind: 'intl',
    graphemes(text) {
      return Array.from(graphemeSeg.segment(text), (s) => s.segment);
    },
    words(text) {
      return Array.from(wordSeg.segment(text), (s) => ({
        segment: s.segment,
        index: s.index,
        isWordLike: s.isWordLike === true,
      }));
    },
  };
}

const cache = new Map<string, Segmenter>();

/**
 * Retourne un segmenteur pour la langue donnée. `force` permet d'imposer la
 * stratégie (utile pour les tests et pour forcer le repli).
 */
export function getSegmenter(locale = 'fr', force?: 'intl' | 'fallback'): Segmenter {
  const key = `${locale}|${force ?? 'auto'}`;
  let seg = cache.get(key);
  if (!seg) {
    seg = force === 'fallback' ? createFallbackSegmenter() : (createIntlSegmenter(locale) ?? createFallbackSegmenter());
    cache.set(key, seg);
  }
  return seg;
}
