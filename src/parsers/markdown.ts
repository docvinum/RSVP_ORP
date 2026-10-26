import markdownIt, { type MarkdownIt, type Token } from 'markdown-it';
import type { BlockKind, RawBlock } from '../core/model';
import { htmlToBlocks } from './html';

/**
 * Markdown (CommonMark + tableaux GFM) via markdown-it, embarqué dans le
 * build. Le Markdown n'est jamais rendu en HTML : le modèle est construit à
 * partir du flux de tokens. Le HTML brut éventuel est analysé de façon inerte
 * (texte uniquement) ; les images sont ignorées.
 */

let parser: MarkdownIt | null = null;

function getParser(): MarkdownIt {
  parser ??= markdownIt({ html: true, linkify: false, typographer: false });
  return parser;
}

function inlineText(children: Token[] | null): string {
  let out = '';
  for (const t of children ?? []) {
    switch (t.type) {
      case 'text':
      case 'code_inline':
        out += t.content;
        break;
      case 'softbreak':
      case 'hardbreak':
        out += ' ';
        break;
      default:
        // image, html_inline, ouvertures/fermetures de liens et d'emphase : ignorés.
        break;
    }
  }
  return out;
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
        if (hasDomParser()) blocks.push(...htmlToBlocks(t.content));
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
