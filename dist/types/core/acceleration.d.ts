import { type AccelerationSettings } from './settings';
/**
 * Accélération progressive : vitesse en fonction du temps de lecture
 * effectif écoulé (les pauses ne comptent pas).
 *
 *   v(t) = start + (target − start) × courbe(min(1, t / durée))
 *
 * `linear` : courbe(x) = x ; `ease-in-out` : courbe(x) = x² × (3 − 2x).
 * Le résultat est arrondi à l'entier et ne dépasse jamais 900 mots/minute.
 */
export declare function accelerationProgress(acc: AccelerationSettings, elapsedMs: number): number;
export declare function accelerationSpeed(acc: AccelerationSettings, elapsedMs: number): number;
