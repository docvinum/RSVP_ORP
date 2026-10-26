/**
 * Normalisation du texte d'un bloc :
 * - forme Unicode NFC ;
 * - suppression des caractères invisibles parasites (espace sans chasse,
 *   BOM, trait d'union conditionnel, caractères de contrôle) ; le ZWJ est
 *   conservé car il compose certains emoji ;
 * - fusion des espaces sécables (y compris retours à la ligne) en une espace ;
 * - les espaces insécables (U+00A0, U+202F, U+2007) sont conservées pour
 *   respecter la typographie française (« 1 000 », « Bonjour ! ») ;
 * - suppression des espaces en début et fin de bloc.
 */
export declare function normalizeText(input: string): string;
