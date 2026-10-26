import markdownIt, { type MarkdownIt, type Token } from 'markdown-it';
import type { BlockKind, RawBlock } from '../core/model';
import { htmlFragmentText, htmlToBlocks, htmlToTextFallback } from './html';

/**
 * Markdown (CommonMark + tableaux GFM) via markdown-it, embarqué dans le
 * build. Le Markdown n'est jamais rendu en HTML : le modèle est construit à
 * partir du flux de tokens. Le HTML brut éventuel (blocs ou balises inline)
 * est analysé de façon inerte avec les mêmes exclusions que les sources HTML
 * et DOM (scripts, éléments masqués…) ; les images sont ignorées.
 */

const escapeHtml = (text: string) => text.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;');

let parser: MarkdownIt | null = null;

function getParser(): MarkdownIt {
  parser ??= markdownIt({ html: true, linkify: false, typographer: false });
  return parser;
}

function inlineText(children: Token[] | null): string {
  let out = '';
  let html = '';
  let hasHtml = false;
  for (const t of children ?? []) {
    switch (t.type) {
      case 'text':
      case 'code_inline':
        out += t.content;
        html += escapeHtml(t.content);
        break;
      case 'softbreak':
      case 'hardbreak':
        out += ' ';
        html += ' ';
        break;
      case 'html_inline':
        // Balise brute : reconstruite en HTML pour en extraire le texte comme une source HTML.
        hasHtml = true;
        html += t.content;
        break;
      default:
        // image, ouvertures/fermetures de liens et d'emphase : ignorés.
        break;
    }
  }
  return hasHtml ? htmlFragmentText(html) : out;
}

function hasDomParser(): boolean {
  return typeof (globalThis as { DOMParser?: unknown }).DOMParser === 'function';
}

export function markdownToBlocks(markdown: string): RawBlock[] {
  const tokens = getParser().parse(markdown, {});
  const blocks: RawBlock[] = [];
  const kinds: BlockKind[] = [];
  let heading = 0;
  let row: string[] | null = null;

  for (const t of tokens) {
    switch (t.type) {
      case 'heading_open':
        heading = Number(t.tag.slice(1)) || 2;
        break;
      case 'heading_close':
        heading = 0;
        break;
      case 'blockquote_open':
        kinds.push('quote');
        break;
      case 'list_item_open':
        kinds.push('list-item');
        break;
      case 'blockquote_close':
      case 'list_item_close':
        kinds.pop();
        break;
      case 'tr_open':
        row = [];
        break;
      case 'tr_close':
        if (row) blocks.push({ kind: 'table-row', text: row.join(' ') });
        row = null;
        break;
      case 'fence':
      case 'code_block':
        blocks.push({ kind: 'code', text: t.content });
        break;
      case 'html_block':
        if (hasDomParser()) {
          try {
            blocks.push(...htmlToBlocks(t.content));
            break;
          } catch {
            // Analyse refusée : repli ci-dessous.
          }
        }
        blocks.push({ kind: 'paragraph', text: htmlToTextFallback(t.content) });
        break;
      case 'inline': {
        const text = inlineText(t.children);
        if (row) row.push(text);
        else if (heading) blocks.push({ kind: 'heading', level: heading, text });
        else blocks.push({ kind: kinds[kinds.length - 1] ?? 'paragraph', text });
        break;
      }
      default:
        break;
    }
  }
  return blocks.filter((b) => /\S/u.test(b.text));
}
