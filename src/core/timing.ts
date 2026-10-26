import type { Word } from './model';
import type { TimingCoefficients } from './settings';

/**
 * Calcul centralisé et déterministe de la durée d'affichage d'un mot.
 *
 *   durée = (60 000 / vitesse) × pause × motLong
 *
 * - `pause` = coefficient de la ponctuation la plus forte : fin de bloc
 *   (`paragraph`, si supérieur à celui de la phrase), fin de phrase
 *   (`sentence`), `;` `:` `—` (`clause`), `,` (`comma`), sinon 1 ;
 * - `motLong` = 1 + min(longWordMaxExtra, (lettres − seuil) × longWordStep)
 *   lorsque le mot compte plus de `longWordThreshold` lettres, sinon 1.
 *
 * La vitesse affichée est donc une cadence nominale : la cadence effective
 * est plus faible du fait des pauses.
 */
export function baseWordDuration(speed: number): number {
  return 60000 / speed;
}

export function pauseMultiplier(word: Pick<Word, 'punctuation' | 'endsSentence' | 'endsBlock'>, t: TimingCoefficients): number {
  let m = 1;
  if (word.punctuation === 'comma') m = t.comma;
  else if (word.punctuation === 'clause') m = t.clause;
  if (word.endsSentence || word.punctuation === 'sentence') m = Math.max(m, t.sentence);
  if (word.endsBlock) m = Math.max(m, t.paragraph);
  return m;
}

export function longWordMultiplier(letterCount: number, t: TimingCoefficients): number {
  if (letterCount <= t.longWordThreshold) return 1;
  return 1 + Math.min(t.longWordMaxExtra, (letterCount - t.longWordThreshold) * t.longWordStep);
}

export function wordMultiplier(word: Pick<Word, 'punctuation' | 'endsSentence' | 'endsBlock' | 'letterCount'>, t: TimingCoefficients): number {
  return pauseMultiplier(word, t) * longWordMultiplier(word.letterCount, t);
}

/** Durée d'affichage du mot en millisecondes. */
export function wordDuration(word: Pick<Word, 'punctuation' | 'endsSentence' | 'endsBlock' | 'letterCount'>, speed: number, t: TimingCoefficients): number {
  return baseWordDuration(speed) * wordMultiplier(word, t);
}
