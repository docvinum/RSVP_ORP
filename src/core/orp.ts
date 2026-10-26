import { getSegmenter, type Segmenter } from './segmentation';

/**
 * Calcul du point de reconnaissance optimal (ORP).
 *
 * Algorithme déterministe, en graphèmes :
 * 1. le mot est découpé en graphèmes (« é », « 👍🏽 » comptent pour un) ;
 * 2. la partie lexicale va du premier au dernier graphème lettre/chiffre ;
 *    la ponctuation attenante (« (», « », », ») ») est exclue du calcul ;
 * 3. la position dans la partie lexicale dépend de sa longueur L :
 *      L ≤ 1 → 0 ; 2–5 → 1 ; 6–9 → 2 ; 10–13 → 3 ; ≥ 14 → 4 ;
 * 4. sans lettre ni chiffre, le graphème central est retenu.
 */

export interface OrpSplit {
  /** Graphèmes avant la lettre ORP. */
  before: string;
  /** Lettre ORP (un graphème). */
  pivot: string;
  /** Graphèmes après la lettre ORP. */
  after: string;
  /** Index du graphème ORP dans le mot. */
  index: number;
  /** Nombre total de graphèmes. */
  length: number;
}

const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

export function orpOffset(lexicalLength: number): number {
  if (lexicalLength <= 1) return 0;
  if (lexicalLength <= 5) return 1;
  if (lexicalLength <= 9) return 2;
  if (lexicalLength <= 13) return 3;
  return 4;
}

export function orpIndex(graphemes: readonly string[]): number {
  let first = -1;
  let last = -1;
  graphemes.forEach((g, i) => {
    if (LETTER_OR_DIGIT.test(g)) {
      if (first < 0) first = i;
      last = i;
    }
  });
  if (first < 0) return Math.max(0, Math.floor((graphemes.length - 1) / 2));
  return first + orpOffset(last - first + 1);
}

export function splitOrp(word: string, segmenter: Segmenter = getSegmenter()): OrpSplit {
  const graphemes = segmenter.graphemes(word);
  if (graphemes.length === 0) return { before: '', pivot: '', after: '', index: 0, length: 0 };
  const index = orpIndex(graphemes);
  return {
    before: graphemes.slice(0, index).join(''),
    pivot: graphemes[index] ?? '',
    after: graphemes.slice(index + 1).join(''),
    index,
    length: graphemes.length,
  };
}
