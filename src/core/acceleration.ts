import { SPEED, type AccelerationSettings } from './settings';

/**
 * Accélération progressive : vitesse en fonction du temps de lecture
 * effectif écoulé (les pauses ne comptent pas).
 *
 *   v(t) = start + (target − start) × courbe(min(1, t / durée))
 *
 * `linear` : courbe(x) = x ; `ease-in-out` : courbe(x) = x² × (3 − 2x).
 * Le résultat est arrondi à l'entier et ne dépasse jamais 900 mots/minute.
 */
export function accelerationProgress(acc: AccelerationSettings, elapsedMs: number): number {
  const x = Math.min(1, Math.max(0, elapsedMs / (acc.duration * 1000)));
  return acc.curve === 'ease-in-out' ? x * x * (3 - 2 * x) : x;
}

export function accelerationSpeed(acc: AccelerationSettings, elapsedMs: number): number {
  const v = acc.startSpeed + (acc.targetSpeed - acc.startSpeed) * accelerationProgress(acc, elapsedMs);
  return Math.min(SPEED.max, Math.max(SPEED.min, Math.round(v)));
}
