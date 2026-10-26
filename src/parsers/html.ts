import type { RawBlock } from '../core/model';
import { ReaderError } from '../core/errors';
import { extractBlocksFromNode, type DomExtractOptions } from './dom';

/**
 * HTML : analyse via `DOMParser`. Le document produit n'est jamais inséré
 * dans la page et n'a pas de contexte de navigation : aucun script n'y est
 * exécuté, et les navigateurs actuels n'y chargent pas de ressources (cette
 * dernière propriété n'est pas garantie par la spécification). Seul le texte
 * est extrait, avec les mêmes exclusions que pour une source DOM.
 *
 * Sous une politique Trusted Types (`require-trusted-types-for 'script'`),
 * l'analyse d'une chaîne peut être refusée : une `ReaderError`
 * `ENVIRONMENT` est alors levée (préférez la source `dom` ou `text`).
 */
export function htmlToBlocks(html: string, options: Omit<DomExtractOptions, 'checkVisibility'> = {}): RawBlock[] {
  const Parser = (globalThis as { DOMParser?: typeof DOMParser }).DOMParser;
  if (typeof Parser !== 'function') {
    throw new ReaderError('ENVIRONMENT', 'DOMParser est requis pour analyser du HTML.');
  }
  let doc: Document;
  try {
    doc = new Parser().parseFromString(html, 'text/html');
  } catch (error) {
    throw new ReaderError('ENVIRONMENT', 'Analyse HTML refusée par le navigateur (politique Trusted Types ?).', { cause: error });
  }
  return extractBlocksFromNode(doc.body ?? doc.documentElement, { ...options, checkVisibility: false });
}

const SKIPPED_ELEMENTS = /<(script|style|template|noscript|iframe|object|svg|math|textarea|select|button|title)\b[^>]*>[\s\S]*?<\/\1\s*>/giu;
const BREAKING_TAGS = /<\/?(?:br|p|div|li|ul|ol|h[1-6]|tr|td|th|table|blockquote|pre|section|article|header|footer|dd|dt|hr)\b[^>]*>/giu;
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u{A0}' };

/**
 * Repli sans DOM (Node, ou analyse refusée) : extraction du texte d'un
 * fragment HTML par expressions régulières. Exclut le contenu des éléments
 * non textuels (script, style…) et conserve une frontière de mot sur les
 * balises de rupture (`<br>`, paragraphes…). Moins précis que le DOM :
 * l'attribut `hidden` et les styles ne sont pas pris en compte.
 */
export function htmlToTextFallback(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/gu, '')
    .replace(SKIPPED_ELEMENTS, ' ')
    .replace(BREAKING_TAGS, ' ')
    .replace(/<[^>]*>/gu, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/giu, (m, ent: string) => {
      if (ent[0] === '#') {
        const code = ent[1] === 'x' || ent[1] === 'X' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
      }
      return ENTITIES[ent.toLowerCase()] ?? m;
    });
}

/**
 * Texte d'un fragment HTML, avec les exclusions de la source DOM quand
 * `DOMParser` est disponible, sinon via le repli par expressions régulières.
 */
export function htmlFragmentText(html: string): string {
  try {
    return htmlToBlocks(html)
      .map((b) => b.text)
      .join(' ');
  } catch {
    return htmlToTextFallback(html);
  }
}
