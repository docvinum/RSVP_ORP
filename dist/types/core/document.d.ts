import type { NormalizedDocument, RawBlock } from './model';
export interface BuildDocumentOptions {
    /** Langue BCP 47 utilisée pour la segmentation. Défaut : `fr`. */
    locale?: string;
    /** Force une stratégie de segmentation (tests, compatibilité). */
    segmentation?: 'intl' | 'fallback';
    /**
     * Au-delà de ce nombre de lettres, un mot est découpé en segments
     * équilibrés d'au plus 16 lettres (affichés avec un trait d'union) pour
     * rester lisible sur écran étroit. Défaut : 25 (min. 12).
     */
    maxWordLength?: number;
}
/** Séparateur inséré entre deux blocs dans `NormalizedDocument.text`. */
export declare const BLOCK_SEPARATOR = "\n\n";
/**
 * Construit le modèle normalisé à partir de blocs bruts. Fonction pure et
 * déterministe : un même contenu produit toujours les mêmes index.
 */
export declare function buildDocument(rawBlocks: readonly RawBlock[], options?: BuildDocumentOptions): NormalizedDocument;
/** Position du mot contenant (ou suivant) l'offset donné dans le texte normalisé. */
export declare function wordIndexAtOffset(doc: NormalizedDocument, offset: number): number;
