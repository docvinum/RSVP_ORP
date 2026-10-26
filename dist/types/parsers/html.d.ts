import type { RawBlock } from '../core/model';
import { type DomExtractOptions } from './dom';
/**
 * HTML : analyse inerte via `DOMParser`. Le document produit n'a pas de
 * contexte de navigation : aucun script n'est exécuté, aucune ressource
 * (image, feuille de style, iframe) n'est chargée, et il n'est jamais inséré
 * dans la page. Seul le texte est extrait.
 */
export declare function htmlToBlocks(html: string, options?: Omit<DomExtractOptions, 'checkVisibility'>): RawBlock[];
