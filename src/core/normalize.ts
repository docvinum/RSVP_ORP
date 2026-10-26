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

// eslint-disable-next-line no-control-regex -- suppression volontaire des caractères de contrôle
const INVISIBLE = /[\u{0}-\u{8}\u{B}\u{E}-\u{1F}\u{7F}-\u{9F}\u{AD}\u{200B}\u{200E}\u{200F}\u{2060}\u{FEFF}]/gu;
const BREAKING_SPACES = /[\t\n\f\r \u{1680}\u{2000}-\u{2006}\u{2008}-\u{200A}\u{2028}\u{2029}\u{205F}\u{3000}]+/gu;
const MIXED_SPACES = / ?([\u{A0}\u{202F}\u{2007}])[ \u{A0}\u{202F}\u{2007}]*/gu;

export function normalizeText(input: string): string {
  return input
    .normalize('NFC')
    .replace(INVISIBLE, '')
    .replace(BREAKING_SPACES, ' ')
    .replace(MIXED_SPACES, '$1')
    .replace(/^\s+|\s+$/gu, '');
}
