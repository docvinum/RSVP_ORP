import type { BlockKind, RawBlock } from '../core/model';

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

const EXCLUDED_TAGS = new Set([
  'script', 'style', 'noscript', 'template', 'iframe', 'frame', 'object', 'embed', 'applet', 'canvas', 'svg',
  'math', 'audio', 'video', 'picture', 'img', 'map', 'button', 'input', 'select', 'textarea', 'option',
  'optgroup', 'datalist', 'output', 'progress', 'meter', 'label', 'nav', 'dialog', 'menu', 'head', 'title',
  'meta', 'link', 'base', 'slot', 'urr-reader',
]);

const EXCLUDED_ROLES = new Set([
  'button', 'navigation', 'menu', 'menubar', 'toolbar', 'dialog', 'alertdialog', 'search', 'tablist', 'tab',
  'searchbox', 'textbox', 'combobox', 'listbox', 'slider', 'spinbutton', 'switch', 'checkbox', 'radio',
]);

const BLOCK_TAGS = new Set([
  'address', 'article', 'aside', 'blockquote', 'dd', 'details', 'div', 'dl', 'dt', 'fieldset', 'figcaption',
  'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'li', 'main', 'ol',
  'p', 'pre', 'section', 'summary', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'caption', 'ul', 'body', 'center',
]);

const CELL_TAGS = new Set(['td', 'th']);

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const CDATA_NODE = 4;

interface Context {
  kind: BlockKind;
  level?: number;
}

function deriveContext(tag: string, parent: Context): Context {
  const heading = /^h([1-6])$/.exec(tag);
  if (heading) return { kind: 'heading', level: Number(heading[1]) };
  if (tag === 'li' || tag === 'dd' || tag === 'dt') return { kind: 'list-item' };
  if (tag === 'blockquote') return { kind: 'quote' };
  if (tag === 'pre') return { kind: 'code' };
  if (tag === 'tr') return { kind: 'table-row' };
  if (parent.kind === 'quote' || parent.kind === 'list-item' || parent.kind === 'code') return parent;
  return { kind: 'paragraph' };
}

function isHidden(el: Element, options: DomExtractOptions): boolean {
  if (el.hasAttribute('hidden') || el.hasAttribute('inert') || el.hasAttribute('data-rsvp-ignore')) return true;
  if (el.getAttribute('aria-hidden') === 'true') return true;
  const role = el.getAttribute('role');
  if (role && EXCLUDED_ROLES.has(role.trim().toLowerCase())) return true;
  if (options.exclude) {
    try {
      if (el.matches(options.exclude)) return true;
    } catch {
      // Sélecteur invalide : ignoré.
    }
  }
  if (options.checkVisibility) {
    const view = el.ownerDocument?.defaultView;
    if (view && el.isConnected) {
      const style = view.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return true;
    }
  }
  return false;
}

export function extractBlocksFromNode(root: Node, options: DomExtractOptions = {}): RawBlock[] {
  const blocks: RawBlock[] = [];
  let current: { ctx: Context; text: string } | null = null;

  const flush = () => {
    if (current && /\S/u.test(current.text)) {
      blocks.push(current.ctx.kind === 'heading' ? { kind: 'heading', level: current.ctx.level ?? 2, text: current.text } : { kind: current.ctx.kind, text: current.text });
    }
    current = null;
  };
  const append = (ctx: Context, text: string) => {
    if (!current) current = { ctx, text: '' };
    current.text += text;
  };

  // Parcours itératif (pas de récursion profonde sur de grands documents).
  type Frame = { node: Node; ctx: Context; exit?: boolean; block?: boolean; cell?: boolean };
  const stack: Frame[] = [{ node: root, ctx: { kind: 'paragraph' } }];
  while (stack.length > 0) {
    const frame = stack.pop()!;
    const { node, ctx } = frame;
    if (frame.exit) {
      if (frame.cell) append(ctx, ' ');
      if (frame.block) flush();
      continue;
    }
    if (node.nodeType === TEXT_NODE || node.nodeType === CDATA_NODE) {
      append(ctx, node.nodeValue ?? '');
      continue;
    }
    if (node.nodeType !== ELEMENT_NODE && node !== root) continue;
    let childCtx = ctx;
    let block = false;
    let cell = false;
    if (node.nodeType === ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.localName.toLowerCase();
      if (EXCLUDED_TAGS.has(tag) || (node !== root && isHidden(el, options))) continue;
      if (tag === 'br' || tag === 'wbr') {
        if (tag === 'br') append(ctx, ' ');
        continue;
      }
      block = BLOCK_TAGS.has(tag);
      cell = CELL_TAGS.has(tag);
      if (block) {
        flush();
        childCtx = deriveContext(tag, ctx);
      }
      if (cell) append(ctx, ' ');
    }
    const children = node.childNodes;
    stack.push({ node, ctx, exit: true, block, cell });
    for (let i = children.length - 1; i >= 0; i--) stack.push({ node: children[i]!, ctx: childCtx });
  }
  flush();
  return blocks;
}
