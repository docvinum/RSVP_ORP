import type { NormalizedDocument, RawBlock } from '../core/model';
import { extractBlocksFromNode } from './dom';
import { htmlToBlocks } from './html';
import { markdownToBlocks } from './markdown';
import { textToBlocks } from './text';
export type ReaderSource = {
    type: 'text';
    text: string;
} | {
    type: 'html';
    html: string;
} | {
    type: 'markdown';
    markdown: string;
} | {
    type: 'dom';
    element: HTMLElement;
};
export interface ParseOptions {
    /** Langue du contenu (segmentation). Défaut : `lang` de l'élément DOM, sinon `fr`. */
    locale?: string;
    /** Sélecteur CSS de contenus à exclure (sources `html` et `dom`). */
    exclude?: string;
    /** Force la stratégie de segmentation. */
    segmentation?: 'intl' | 'fallback';
}
/** Valide une source et en extrait des blocs bruts. */
export declare function sourceToBlocks(source: ReaderSource, options?: ParseOptions): RawBlock[];
/**
 * Point d'entrée des parseurs : source → modèle normalisé.
 * @throws {ReaderError} `INVALID_SOURCE`, `EMPTY_CONTENT`, `ENVIRONMENT`, `PARSE_ERROR`.
 */
export declare function parseSource(source: ReaderSource, options?: ParseOptions): NormalizedDocument;
export { textToBlocks, htmlToBlocks, markdownToBlocks, extractBlocksFromNode };
