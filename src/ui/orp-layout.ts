/**
 * Placement horizontal du mot RSVP, calcul pur (testé séparément du rendu).
 *
 * Le centre de la lettre ORP est placé sur l'axe de fixation `axisX`. Si le
 * mot déborde d'un côté de la zone utile, la taille de police est réduite
 * (facteur `scale`, jamais en dessous de `minScale`) : les mots longs restent
 * entiers, lisibles et alignés sur le même axe.
 */
export interface PlacementInput {
  /** Largeur de la zone d'affichage (px). */
  stageWidth: number;
  /** Position de l'axe de fixation depuis le bord gauche (px). */
  axisX: number;
  /** Largeurs mesurées à l'échelle 1 (px). */
  beforeWidth: number;
  pivotWidth: number;
  afterWidth: number;
  /** Marge intérieure minimale de chaque côté (px). */
  padding?: number;
  minScale?: number;
}

export interface Placement {
  /** Décalage du bord gauche du mot depuis le bord gauche de la zone (px). */
  offsetX: number;
  /** Facteur de réduction de la police (≤ 1). */
  scale: number;
}

export function computePlacement(input: PlacementInput): Placement {
  const padding = input.padding ?? 8;
  const minScale = input.minScale ?? 0.4;
  const left = input.beforeWidth + input.pivotWidth / 2;
  const right = input.afterWidth + input.pivotWidth / 2;
  const roomLeft = Math.max(1, input.axisX - padding);
  const roomRight = Math.max(1, input.stageWidth - input.axisX - padding);
  let scale = 1;
  if (left > roomLeft) scale = Math.min(scale, roomLeft / left);
  if (right > roomRight) scale = Math.min(scale, roomRight / right);
  scale = Math.max(minScale, scale);
  return { offsetX: input.axisX - left * scale, scale };
}

/** Position relative de l'axe de fixation dans la zone RSVP. */
export const AXIS_RATIO = 0.38;
