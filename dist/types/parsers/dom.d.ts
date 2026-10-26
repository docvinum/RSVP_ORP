import type { RawBlock } from '../core/model';
/**
 * Extraction en lecture seule d'un arbre DOM vers des blocs bruts.
 *
 * Garanties :
 * - aucune écriture dans le DOM (ni attribut, ni nœud, ni style) : seules des
 *   propriétés en lecture (`childNodes`, `nodeValue`, `getAttribute`,
 *   `matches`, `getComputedStyle`) sont utilisées ;
 * - les scripts, styles, médias, contrôles de formulaire, navigations et
 *   contenus masqués sont ignorés ;
 * - les racines fantômes (Shadow DOM) de l'hôte ne sont pas parcourues.
 */
export interface DomExtractOptions {
    /** Sélecteur CSS de contenus supplémentaires à exclure. */
    exclude?: string;
    /** Ignore les éléments non affichés (`display:none`, `visibility:hidden`). Défaut : vrai pour un DOM vivant. */
    checkVisibility?: boolean;
}
export declare function extractBlocksFromNode(root: Node, options?: DomExtractOptions): RawBlock[];
