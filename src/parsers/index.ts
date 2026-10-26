import { buildDocument } from '../core/document';
import { ReaderError } from '../core/errors';
import type { NormalizedDocument, RawBlock } from '../core/model';
import { extractBlocksFromNode } from './dom';
import { htmlToBlocks } from './html';
import { markdownToBlocks } from './markdown';
import { textToBlocks } from './text';

export type ReaderSource =
  | { type: 'text'; text: string }
  | { type: 'html'; html: string }
  | { type: 'markdown'; markdown: string }
  | { type: 'dom'; element: HTMLElement };

export interface ParseOptions {
  /** Langue du contenu (segmentation). Défaut : `lang` de l'élément DOM, sinon `fr`. */
  locale?: string;
  /** Sélecteur CSS de contenus à exclure (sources `html` et `dom`). */
  exclude?: string;
  /** Force la stratégie de segmentation. */
  segmentation?: 'intl' | 'fallback';
}

function isElement(v: unknown): v is HTMLElement {
  return typeof v === 'object' && v !== null && (v as Node).nodeType === 1 && typeof (v as Element).localName === 'string';
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new ReaderError('INVALID_SOURCE', `La source doit fournir « ${field} » sous forme de chaîne.`);
  return value;
}

/** Valide une source et en extrait des blocs bruts. */
export function sourceToBlocks(source: ReaderSource, options: ParseOptions = {}): RawBlock[] {
  if (typeof source !== 'object' || source === null) {
    throw new ReaderError('INVALID_SOURCE', 'Source absente ou invalide.');
  }
  const exclude = options.exclude;
  switch ((source as { type?: unknown }).type) {
    case 'text':
      return textToBlocks(requireString((source as { text?: unknown }).text, 'text'));
    case 'html':
      return htmlToBlocks(requireString((source as { html?: unknown }).html, 'html'), exclude ? { exclude } : {});
    case 'markdown':
      return markdownToBlocks(requireString((source as { markdown?: unknown }).markdown, 'markdown'));
    case 'dom': {
      const element = (source as { element?: unknown }).element;
      if (!isElement(element)) throw new ReaderError('INVALID_SOURCE', 'La source « dom » doit fournir un élément HTML.');
      return extractBlocksFromNode(element, { checkVisibility: true, ...(exclude ? { exclude } : {}) });
    }
    default:
      throw new ReaderError('INVALID_SOURCE', `Type de source inconnu : ${String((source as { type?: unknown }).type)}.`);
  }
}

/** Langue déclarée par l'élément ou un ancêtre (`lang`), en lecture seule. */
function domLocale(source: ReaderSource): string | undefined {
  if (source.type !== 'dom' || !isElement(source.element)) return undefined;
  const el = source.element.closest?.('[lang]');
  const lang = el?.getAttribute('lang')?.trim();
  return lang || undefined;
}

/**
 * Point d'entrée des parseurs : source → modèle normalisé.
 * @throws {ReaderError} `INVALID_SOURCE`, `EMPTY_CONTENT`, `ENVIRONMENT`, `PARSE_ERROR`.
 */
export function parseSource(source: ReaderSource, options: ParseOptions = {}): NormalizedDocument {
  let blocks: RawBlock[];
  try {
    blocks = sourceToBlocks(source, options);
  } catch (error) {
    if (error instanceof ReaderError) throw error;
    throw new ReaderError('PARSE_ERROR', 'Impossible d’extraire le contenu.', { cause: error });
  }
  const locale = options.locale ?? domLocale(source) ?? 'fr';
  const doc = buildDocument(blocks, { locale, ...(options.segmentation ? { segmentation: options.segmentation } : {}) });
  if (doc.words.length === 0) throw new ReaderError('EMPTY_CONTENT', 'La source ne contient aucun texte lisible.');
  return doc;
}

export { textToBlocks, htmlToBlocks, markdownToBlocks, extractBlocksFromNode };
