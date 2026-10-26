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
export declare function baseWordDuration(speed: number): number;
export declare function pauseMultiplier(word: Pick<Word, 'punctuation' | 'endsSentence' | 'endsBlock'>, t: TimingCoefficients): number;
export declare function longWordMultiplier(letterCount: number, t: TimingCoefficients): number;
export declare function wordMultiplier(word: Pick<Word, 'punctuation' | 'endsSentence' | 'endsBlock' | 'letterCount'>, t: TimingCoefficients): number;
/** Durée d'affichage du mot en millisecondes. */
export declare function wordDuration(word: Pick<Word, 'punctuation' | 'endsSentence' | 'endsBlock' | 'letterCount'>, speed: number, t: TimingCoefficients): number;
