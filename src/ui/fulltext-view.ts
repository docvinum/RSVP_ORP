import type { Block, NormalizedDocument } from '../core/model';
import { h } from './dom';

/**
 * Vue du texte intégral, reconstruite à partir du modèle normalisé (jamais du
 * HTML source). Chaque mot porte son index stable (`data-w`), chaque phrase
 * le sien (`data-s`) : la synchronisation est en O(1).
 *
 * Suivi automatique : le défilement n'a lieu que lorsque le mot courant sort
 * d'une bande de confort (15 %–70 % de la hauteur visible). Toute action de
 * défilement de l'utilisateur (molette, toucher, clavier, barre de
 * défilement) suspend le suivi jusqu'à sa réactivation explicite.
 */
export interface FullTextCallbacks {
  onWordActivate(index: number): void;
  onFollowChange(following: boolean): void;
}

const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

export class FullTextView {
  readonly element: HTMLElement;
  private words: HTMLElement[] = [];
  private sentences: HTMLElement[] = [];
  private currentWord = -1;
  private currentSentence = -1;
  private following = true;
  private reducedMotion = false;

  constructor(
    private readonly callbacks: FullTextCallbacks,
    signal: AbortSignal,
    label: string,
  ) {
    this.element = h('div', { class: 'fulltext', role: 'region', 'aria-label': label, tabindex: 0, part: 'fulltext' });
    const el = this.element;
    el.addEventListener('click', (e) => {
      const target = (e.target as Element | null)?.closest?.('[data-w]');
      if (!target || !el.contains(target)) return;
      const index = Number((target as HTMLElement).dataset.w);
      if (Number.isInteger(index)) {
        this.setFollowing(true);
        this.callbacks.onWordActivate(index);
      }
    }, { signal });
    const suspend = () => this.setFollowing(false);
    el.addEventListener('wheel', suspend, { passive: true, signal });
    el.addEventListener('touchmove', suspend, { passive: true, signal });
    el.addEventListener('keydown', (e) => {
      if (e.target === el && SCROLL_KEYS.has(e.key)) suspend();
    }, { signal });
    el.addEventListener('pointerdown', (e) => {
      // Clic sur la barre de défilement (cible = le conteneur lui-même).
      if (e.target === el && e.offsetX > el.clientWidth) suspend();
    }, { signal });
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  get isFollowing(): boolean {
    return this.following;
  }

  setFollowing(following: boolean): void {
    if (following === this.following) return;
    this.following = following;
    this.callbacks.onFollowChange(following);
    if (following) this.scrollToCurrent(true);
  }

  render(doc: NormalizedDocument): void {
    const el = this.element;
    el.replaceChildren();
    this.words = new Array<HTMLElement>(doc.words.length);
    this.sentences = new Array<HTMLElement>(doc.sentences.length);
    this.currentWord = -1;
    this.currentSentence = -1;
    let list: HTMLUListElement | null = null;
    for (const block of doc.blocks) {
      const content = this.renderBlock(doc, block);
      if (block.kind === 'list-item') {
        if (!list) {
          list = h('ul');
          el.append(list);
        }
        list.append(h('li', {}, content));
        continue;
      }
      list = null;
      el.append(this.wrapBlock(block, content));
    }
    el.scrollTop = 0;
  }

  private wrapBlock(block: Block, content: DocumentFragment): HTMLElement {
    switch (block.kind) {
      case 'heading': {
        // Le titre du dialogue est un h2 : les titres du contenu commencent à h3.
        const level = Math.min(6, (block.level ?? 2) + 2);
        return h(`h${level}` as 'h3', {}, content);
      }
      case 'quote':
        return h('blockquote', {}, h('p', {}, content));
      case 'code':
        return h('pre', {}, content);
      default:
        return h('p', {}, content);
    }
  }

  private renderBlock(doc: NormalizedDocument, block: Block): DocumentFragment {
    const frag = document.createDocumentFragment();
    let cursor = block.start;
    for (let s = block.sentenceStart; s < block.sentenceEnd; s++) {
      const sentence = doc.sentences[s]!;
      if (sentence.start > cursor) frag.append(doc.text.slice(cursor, sentence.start));
      const sEl = h('span', { class: 's', 'data-s': s });
      let inner = sentence.start;
      for (let w = sentence.wordStart; w < sentence.wordEnd; w++) {
        const word = doc.words[w]!;
        if (word.start > inner) sEl.append(doc.text.slice(inner, word.start));
        const wEl = h('span', { class: 'w', 'data-w': w }, word.text);
        this.words[w] = wEl;
        sEl.append(wEl);
        inner = word.end;
      }
      if (sentence.end > inner) sEl.append(doc.text.slice(inner, sentence.end));
      this.sentences[s] = sEl;
      frag.append(sEl);
      cursor = sentence.end;
    }
    if (block.end > cursor) frag.append(doc.text.slice(cursor, block.end));
    return frag;
  }

  /** Met en évidence le mot et la phrase courants. */
  highlight(wordIndex: number, sentenceIndex: number): void {
    if (wordIndex !== this.currentWord) {
      const prev = this.words[this.currentWord];
      if (prev) {
        prev.classList.remove('cur');
        prev.removeAttribute('aria-current');
      }
      const next = this.words[wordIndex];
      if (next) {
        next.classList.add('cur');
        next.setAttribute('aria-current', 'true');
      }
      this.currentWord = wordIndex;
    }
    if (sentenceIndex !== this.currentSentence) {
      this.sentences[this.currentSentence]?.classList.remove('active');
      this.sentences[sentenceIndex]?.classList.add('active');
      this.currentSentence = sentenceIndex;
    }
    if (this.following) this.scrollToCurrent(false);
  }

  /** Défile uniquement si le mot courant sort de la bande de confort. */
  scrollToCurrent(force: boolean): void {
    const word = this.words[this.currentWord];
    const el = this.element;
    if (!word || el.clientHeight === 0) return;
    const viewTop = el.scrollTop;
    const height = el.clientHeight;
    const wordRect = word.getBoundingClientRect();
    const relative = wordRect.top - el.getBoundingClientRect().top;
    const top = relative + viewTop;
    if (!force && relative >= height * 0.15 && relative + wordRect.height <= height * 0.7) return;
    const target = Math.max(0, top - height * 0.25);
    if (Math.abs(target - viewTop) < 1) return;
    el.scrollTo({ top: target, behavior: this.reducedMotion || force ? 'auto' : 'smooth' });
  }

  /** @internal */
  wordElement(index: number): HTMLElement | undefined {
    return this.words[index];
  }
}
