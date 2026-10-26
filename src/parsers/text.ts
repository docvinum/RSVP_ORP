import type { RawBlock } from '../core/model';

/** Texte brut : une ligne vide (ou plus) sépare deux paragraphes. */
export function textToBlocks(text: string): RawBlock[] {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n[^\S\n]*\n\s*/u)
    .filter((p) => /\S/u.test(p))
    .map((p) => ({ kind: 'paragraph' as const, text: p }));
}
