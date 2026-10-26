/** Utilitaires de couleur (WCAG 2.x), sans dépendance au DOM. */
export declare function parseHex(hex: string): [number, number, number];
export declare function toHex([r, g, b]: [number, number, number]): string;
export declare function relativeLuminance(hex: string): number;
export declare function contrastRatio(a: string, b: string): number;
/**
 * Retourne `color` si son contraste avec `background` atteint `minRatio`,
 * sinon la couleur la plus proche (même teinte, assombrie ou éclaircie)
 * l'atteignant. Utilisé pour garantir la lisibilité de la lettre ORP
 * (3:1, texte gras de grande taille) quelle que soit la couleur choisie.
 */
export declare function ensureContrast(color: string, background: string, minRatio?: number): string;
