/**
 * Segmentation Unicode.
 *
 * Stratégie : `Intl.Segmenter` est utilisé lorsqu'il est disponible (graphèmes
 * et segments lexicaux). Sinon, un repli à base d'expressions régulières
 * Unicode (`\p{…}`) est utilisé. Le repli gère les marques combinantes, les
 * séquences ZWJ, les sélecteurs de variante et les paires d'indicateurs
 * régionaux, mais ne couvre pas toutes les règles UAX #29 (voir
 * docs/limitations.md). Aucune dépendance au DOM.
 */
export interface WordSegment {
    segment: string;
    index: number;
    isWordLike: boolean;
}
export interface Segmenter {
    readonly kind: 'intl' | 'fallback';
    graphemes(text: string): string[];
    words(text: string): WordSegment[];
}
export declare function createFallbackSegmenter(): Segmenter;
export declare function createIntlSegmenter(locale: string): Segmenter | undefined;
/**
 * Retourne un segmenteur pour la langue donnée. `force` permet d'imposer la
 * stratégie (utile pour les tests et pour forcer le repli).
 */
export declare function getSegmenter(locale?: string, force?: 'intl' | 'fallback'): Segmenter;
