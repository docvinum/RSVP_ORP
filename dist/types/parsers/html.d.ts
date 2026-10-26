import type { RawBlock } from '../core/model';
import { type DomExtractOptions } from './dom';
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
export declare function htmlToBlocks(html: string, options?: Omit<DomExtractOptions, 'checkVisibility'>): RawBlock[];
/**
 * Repli sans DOM (Node, ou analyse refusée) : extraction du texte d'un
 * fragment HTML par expressions régulières. Exclut le contenu des éléments
 * non textuels (script, style…) et conserve une frontière de mot sur les
 * balises de rupture (`<br>`, paragraphes…). Moins précis que le DOM :
 * l'attribut `hidden` et les styles ne sont pas pris en compte.
 */
export declare function htmlToTextFallback(html: string): string;
/**
 * Texte d'un fragment HTML, avec les exclusions de la source DOM quand
 * `DOMParser` est disponible, sinon via le repli par expressions régulières.
 */
export declare function htmlFragmentText(html: string): string;
