import type { RawBlock } from '../core/model';
import { ReaderError } from '../core/errors';
import { extractBlocksFromNode, type DomExtractOptions } from './dom';

/**
 * HTML : analyse inerte via `DOMParser`. Le document produit n'a pas de
 * contexte de navigation : aucun script n'est exécuté, aucune ressource
 * (image, feuille de style, iframe) n'est chargée, et il n'est jamais inséré
 * dans la page. Seul le texte est extrait.
 */
export function htmlToBlocks(html: string, options: Omit<DomExtractOptions, 'checkVisibility'> = {}): RawBlock[] {
  const Parser = (globalThis as { DOMParser?: typeof DOMParser }).DOMParser;
  if (typeof Parser !== 'function') {
    throw new ReaderError('ENVIRONMENT', 'DOMParser est requis pour analyser du HTML.');
  }
  const doc = new Parser().parseFromString(html, 'text/html');
  return extractBlocksFromNode(doc.body ?? doc.documentElement, { ...options, checkVisibility: false });
}
