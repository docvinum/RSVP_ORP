import { type Segmenter } from './segmentation';
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
export declare function orpOffset(lexicalLength: number): number;
export declare function orpIndex(graphemes: readonly string[]): number;
export declare function splitOrp(word: string, segmenter?: Segmenter): OrpSplit;
