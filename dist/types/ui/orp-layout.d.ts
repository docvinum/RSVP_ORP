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
export declare function computePlacement(input: PlacementInput): Placement;
/** Position relative de l'axe de fixation dans la zone RSVP. */
export declare const AXIS_RATIO = 0.38;
