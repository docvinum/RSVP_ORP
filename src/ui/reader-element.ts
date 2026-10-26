import { ensureContrast } from '../core/color';
import type { EngineSnapshot, EngineStatus, RsvpEngine } from '../core/engine';
import type { NormalizedDocument } from '../core/model';
import { splitOrp } from '../core/orp';
import { getSegmenter } from '../core/segmentation';
import { SPEED, type ReaderSettings, type SettingsPatch } from '../core/settings';
import { h, icon, setIcon } from './dom';
import { FullTextView } from './fulltext-view';
import type { Labels } from './labels';
import { AXIS_RATIO, computePlacement } from './orp-layout';
import { SettingsPanel } from './settings-panel';
import { FONT_STACKS, STAGE_BACKGROUNDS, STYLES } from './styles';

/**
 * Interface entre le Web Component et le contrôleur du lecteur (api). Le
 * composant n'instancie aucun moteur : il reçoit l'unique instance du
 * contrôleur et lui délègue toutes les actions.
 */
export interface ReaderViewHost {
  readonly engine: RsvpEngine;
  readonly labels: Labels;
  getSettings(): ReaderSettings;
  updateSettings(patch: SettingsPatch): void;
  resetSettings(): void;
  setSpeed(speed: number): void;
  activateWord(index: number): void;
  requestClose(): void;
  /** Le composant a été retiré du document alors qu'il était ouvert. */
  onDisconnected(): void;
}

/** Taille minimale du mot RSVP après réduction d'un mot long (px). */
const MIN_RSVP_FONT_PX = 16;

const INTERACTIVE = 'button, input, select, textarea, summary, a[href], [contenteditable=""], [contenteditable="true"]';
const TEXT_ENTRY = 'input, select, textarea, [contenteditable=""], [contenteditable="true"]';

/** Retourne l'élément focalisé, en traversant les racines fantômes. */
function deepTarget(e: Event): Element | null {
  const path = e.composedPath();
  return (path[0] as Element | undefined) ?? null;
}

/** Interface publique interne du composant `<urr-reader>`. */
export interface ReaderElement extends HTMLElement {
  readonly isOpen: boolean;
  attach(host: ReaderViewHost): void;
  open(doc: NormalizedDocument, title: string): void;
  close(): void;
  teardown(): void;
  applySettings(settings: ReaderSettings): void;
}

let elementClass: (new () => ReaderElement) | null = null;

/**
 * La classe est créée à la demande : le module reste importable sans DOM
 * (rendu serveur Vue/Angular, Node), `HTMLElement` n'étant lu qu'à l'ouverture.
 */
function getElementClass(): new () => ReaderElement {
  if (elementClass) return elementClass;
  class ReaderElementImpl extends HTMLElement implements ReaderElement {
    private host_: ReaderViewHost | null = null;
    private built = false;
    private buildAbort: AbortController | null = null;
    private openAbort: AbortController | null = null;
    private unsubscribers: (() => void)[] = [];
    private resizeObserver: ResizeObserver | null = null;
    private isOpen_ = false;

    // Éléments
    private root!: HTMLElement;
    private dialog!: HTMLDialogElement;
    private titleEl!: HTMLElement;
    private stage!: HTMLElement;
    private wordEl!: HTMLElement;
    private beforeEl!: HTMLElement;
    private pivotEl!: HTMLElement;
    private afterEl!: HTMLElement;
    private stageStatus!: HTMLElement;
    private live!: HTMLElement;
    private range!: HTMLInputElement;
    private positionText!: HTMLElement;
    private remainingText!: HTMLElement;
    private playButton!: HTMLButtonElement;
    private speedOutput!: HTMLOutputElement;
    private speedValue!: HTMLElement;
    private rampText!: HTMLElement;
    private settingsButton!: HTMLButtonElement;
    private resumeFollowButton!: HTMLButtonElement;
    private fullText!: FullTextView;
    private panel!: SettingsPanel;

    private segmenter = getSegmenter();
    private lastWordIndex = -2;
    private lastStatus: EngineStatus | null = null;
    private theme: 'light' | 'dark' = 'light';
    private settings: ReaderSettings | null = null;

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    /** Relie le composant à son contrôleur et construit l'interface (une seule fois). */
    attach(host: ReaderViewHost): void {
      this.host_ = host;
      if (!this.built) this.build();
    }

    get isOpen(): boolean {
      return this.isOpen_;
    }

    private get host(): ReaderViewHost {
      if (!this.host_) throw new Error('ReaderElement non relié à un contrôleur.');
      return this.host_;
    }

    // ───────────────────────── construction ─────────────────────────

    private build(): void {
      const shadow = this.shadowRoot!;
      const L = this.host.labels;
      this.buildAbort = new AbortController();
      const signal = this.buildAbort.signal;

      if ('adoptedStyleSheets' in shadow && typeof CSSStyleSheet === 'function' && 'replaceSync' in CSSStyleSheet.prototype) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(STYLES);
        shadow.adoptedStyleSheets = [sheet];
      } else {
        (shadow as ShadowRoot).append(h('style', {}, STYLES));
      }

      const titleId = 'urr-title';
      const descId = 'urr-desc';
      const btn = (name: Parameters<typeof icon>[0], label: string, extra: Record<string, string> = {}) =>
        h('button', { type: 'button', 'aria-label': label, title: label, ...extra }, icon(name));

      this.titleEl = h('h2', { id: titleId }, L.dialogTitle);
      this.settingsButton = h('button', { type: 'button', 'aria-expanded': 'false', title: L.settings }, icon('settings'), h('span', { class: 'label' }, L.settings));
      const closeButton = btn('close', L.close, { 'data-action': 'close' });

      this.beforeEl = h('span', { class: 'before' });
      this.pivotEl = h('span', { class: 'pivot' });
      this.afterEl = h('span', { class: 'after' });
      this.wordEl = h('div', { class: 'word', 'aria-hidden': 'true', part: 'word' }, this.beforeEl, this.pivotEl, this.afterEl);
      this.stageStatus = h('div', { class: 'stage-status', 'aria-hidden': 'true' });
      this.stage = h('div', { class: 'stage', role: 'region', 'aria-label': L.rsvpRegion, 'aria-describedby': descId, part: 'stage' },
        h('p', { class: 'sr-only', id: descId }, L.rsvpDescription),
        h('div', { class: 'guide-line top' }),
        h('div', { class: 'guide top' }),
        this.wordEl,
        h('div', { class: 'guide bottom' }),
        h('div', { class: 'guide-line bottom' }),
        this.stageStatus,
      );
      this.live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'aria-atomic': 'true' });

      this.range = h('input', { type: 'range', min: 0, max: 0, step: 1, value: 0, 'aria-label': L.progressLabel, part: 'progress' });
      this.positionText = h('span', { 'aria-hidden': 'true' });
      this.remainingText = h('span', { 'aria-hidden': 'true' });

      this.playButton = h('button', { type: 'button', class: 'primary', 'aria-label': L.play, title: L.play, 'data-action': 'toggle' }, icon('play'));
      this.speedValue = h('span', {});
      this.rampText = h('span', { class: 'ramp', hidden: true }, L.accelerating);
      this.speedOutput = h('output', { 'aria-label': L.speedLabel }, this.speedValue, this.rampText);

      this.resumeFollowButton = h('button', { type: 'button', class: 'resume-follow', hidden: true }, icon('follow'), L.resumeFollow);

      this.fullText = new FullTextView({
        onWordActivate: (i) => {
          this.host.activateWord(i);
          // Le prochain geste naturel est de (re)lancer la lecture : Espace doit agir.
          this.playButton.focus({ preventScroll: true });
        },
        onFollowChange: (following) => {
          this.resumeFollowButton.hidden = following;
        },
      }, signal, L.fullText);

      this.panel = new SettingsPanel(L, {
        onChange: (patch) => this.host.updateSettings(patch),
        onReset: () => this.host.resetSettings(),
        onClose: () => this.toggleSettings(false),
      }, signal);
      this.settingsButton.setAttribute('aria-controls', this.panel.panelId);

      const main = h('div', { class: 'main' },
        h('header', {}, this.titleEl, this.settingsButton, closeButton),
        this.stage,
        h('div', { class: 'progress' }, this.positionText, this.range, this.remainingText),
        h('div', { class: 'controls' },
          h('div', { class: 'transport', role: 'group', 'aria-label': L.playbackControls },
            btn('prevSentence', L.previousSentence, { 'data-action': 'prev-sentence' }),
            btn('prevWord', L.previousWord, { 'data-action': 'prev-word' }),
            this.playButton,
            btn('nextWord', L.nextWord, { 'data-action': 'next-word' }),
            btn('nextSentence', L.nextSentence, { 'data-action': 'next-sentence' }),
          ),
          h('div', { class: 'speed', role: 'group', 'aria-label': L.speedLabel },
            btn('minus', L.slower, { 'data-action': 'slower' }),
            this.speedOutput,
            btn('plus', L.faster, { 'data-action': 'faster' }),
          ),
        ),
        h('div', { class: 'fulltext-wrap' }, this.fullText.element, this.resumeFollowButton),
        this.live,
      );

      this.dialog = h('dialog', { 'aria-labelledby': titleId, part: 'dialog' }, h('div', { class: 'layout' }, main, this.panel.element));
      this.root = h('div', { class: 'root', 'data-theme': 'light' }, this.dialog);
      shadow.append(this.root);

      this.dialog.addEventListener('click', (e) => this.onClick(e), { signal });
      this.dialog.addEventListener('keydown', (e) => this.onKeyDown(e), { signal });
      this.dialog.addEventListener('cancel', (e) => {
        e.preventDefault();
        this.host.requestClose();
      }, { signal });
      this.range.addEventListener('input', () => this.host.engine.seek(Number(this.range.value)), { signal });
      this.settingsButton.addEventListener('click', () => this.toggleSettings(), { signal });
      this.resumeFollowButton.addEventListener('click', () => this.fullText.setFollowing(true), { signal });

      this.built = true;
    }

    // ───────────────────────── cycle de vie ─────────────────────────

    /** Affiche le dialogue pour un document. Le composant doit être dans le document. */
    open(doc: NormalizedDocument, title: string): void {
      const host = this.host;
      this.closeView();
      this.openAbort = new AbortController();
      const signal = this.openAbort.signal;
      this.titleEl.textContent = title;
      this.segmenter = getSegmenter(doc.locale);
      this.fullText.render(doc);
      this.fullText.setFollowing(true);
      this.resumeFollowButton.hidden = true;
      this.range.max = String(Math.max(0, doc.words.length - 1));
      this.lastWordIndex = -2;
      this.lastStatus = null;
      this.toggleSettings(false, false);

      const engine = host.engine;
      this.unsubscribers.push(
        engine.on('position', (s) => this.renderSnapshot(s)),
        engine.on('status', () => this.renderSnapshot(engine.getSnapshot())),
        engine.on('speed', () => this.renderSpeed(engine.getSnapshot())),
      );

      const darkQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
      darkQuery?.addEventListener('change', () => this.applySettings(this.host.getSettings()), { signal });
      const motionQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
      this.fullText.setReducedMotion(!!motionQuery?.matches);
      motionQuery?.addEventListener('change', () => this.fullText.setReducedMotion(motionQuery.matches), { signal });

      // Préserve le défilement de la page hôte : pendant l'ouverture, seules les
      // zones défilantes du lecteur (texte intégral, réglages) défilent, y compris
      // lorsque la molette est actionnée au-dessus du fond de la modale.
      const containScroll = (e: Event) => {
        const target = deepTarget(e);
        if (!target || !this.shadowRoot!.contains(target) || !target.closest?.('.fulltext, .panel, input')) e.preventDefault();
      };
      this.ownerDocument.addEventListener('wheel', containScroll, { passive: false, capture: true, signal });
      this.ownerDocument.addEventListener('touchmove', containScroll, { passive: false, capture: true, signal });

      if (typeof ResizeObserver === 'function') {
        this.resizeObserver = new ResizeObserver(() => this.align());
        this.resizeObserver.observe(this.stage);
      }

      this.applySettings(host.getSettings());
      if (!this.dialog.open) this.dialog.showModal();
      this.isOpen_ = true;
      this.renderSnapshot(engine.getSnapshot());
      this.fullText.scrollToCurrent(true);
      this.playButton.focus({ preventScroll: true });
    }

    /** Ferme le dialogue et libère les abonnements et observateurs. Idempotent. */
    close(): void {
      this.closeView();
      if (this.dialog?.open) this.dialog.close();
    }

    private closeView(): void {
      this.isOpen_ = false;
      for (const off of this.unsubscribers.splice(0)) off();
      this.openAbort?.abort();
      this.openAbort = null;
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
    }

    /** Libère définitivement le composant. Idempotent. */
    teardown(): void {
      this.close();
      this.buildAbort?.abort();
      this.buildAbort = null;
      this.host_ = null;
    }

    disconnectedCallback(): void {
      if (this.isOpen_) {
        const host = this.host_;
        this.closeView();
        host?.onDisconnected();
      }
    }

    // ───────────────────────── réglages ─────────────────────────

    applySettings(settings: ReaderSettings): void {
      if (!this.built) return;
      this.settings = settings;
      const a = settings.appearance;
      const dark = a.theme === 'dark' || (a.theme === 'auto' && typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches);
      this.theme = dark ? 'dark' : 'light';
      const orp = ensureContrast(a.orpColor, STAGE_BACKGROUNDS[this.theme], 3);
      this.root.dataset.theme = this.theme;
      this.root.dataset.guides = String(a.showGuides);
      this.root.style.setProperty('--orp', orp);
      this.root.style.setProperty('--rsvp-size', `${a.fontSize}px`);
      this.root.style.setProperty('--rsvp-font', FONT_STACKS[a.fontFamily]);
      this.root.style.setProperty('--axis', `${AXIS_RATIO * 100}%`);
      this.panel.update(settings, orp !== a.orpColor);
      if (this.isOpen_) {
        this.renderSpeed(this.host.engine.getSnapshot());
        this.align();
      }
    }

    private toggleSettings(force?: boolean, moveFocus = true): void {
      const open = force ?? this.panel.element.hidden;
      this.panel.element.hidden = !open;
      this.settingsButton.setAttribute('aria-expanded', String(open));
      if (moveFocus) (open ? this.panel.firstFocusable() : this.settingsButton).focus({ preventScroll: true });
      this.align();
    }

    // ───────────────────────── rendu ─────────────────────────

    private renderSnapshot(s: EngineSnapshot): void {
      const L = this.host.labels;
      const engine = this.host.engine;
      if (s.index !== this.lastWordIndex) {
        this.lastWordIndex = s.index;
        const word = engine.currentWord();
        const split = splitOrp(word?.text ?? '', this.segmenter);
        this.beforeEl.textContent = split.before;
        this.pivotEl.textContent = split.pivot;
        // Segment d'un mot long découpé : trait d'union de continuation.
        this.afterEl.textContent = word?.continues && !/[-‐/_.]$/u.test(word.text) ? `${split.after}‐` : split.after;
        this.align();
        this.fullText.highlight(s.index, s.sentenceIndex);
        this.range.value = String(Math.max(0, s.index));
        const position = L.wordPosition(s.index + 1, s.total);
        this.range.setAttribute('aria-valuetext', position);
        this.positionText.textContent = `${s.index + 1} / ${s.total}`;
        this.range.style.setProperty('--p', String(s.progress));
      }
      this.renderRemaining(s);
      if (s.status !== this.lastStatus) {
        const previous = this.lastStatus;
        this.lastStatus = s.status;
        const playing = s.status === 'playing';
        setIcon(this.playButton, playing ? 'pause' : 'play');
        const label = playing ? L.pause : L.play;
        this.playButton.setAttribute('aria-label', label);
        this.playButton.title = label;
        this.stageStatus.textContent = s.status === 'complete' ? L.statusComplete : '';
        if (previous !== null) {
          this.live.textContent =
            s.status === 'playing' ? L.statusPlaying
            : s.status === 'complete' ? L.statusComplete
            : s.status === 'paused' ? L.statusPaused(s.index + 1, s.total)
            : '';
        }
        this.root.dataset.status = s.status;
      }
      this.renderSpeed(s);
    }

    private renderRemaining(s: EngineSnapshot): void {
      const remainingWords = Math.max(0, s.total - s.index - 1);
      const minutes = Math.round(remainingWords / s.speed);
      this.remainingText.textContent = this.host.labels.remaining(minutes);
    }

    private renderSpeed(s: EngineSnapshot): void {
      const text = `${s.speed} ${this.host.labels.speedUnit}`;
      if (this.speedValue.textContent !== text) this.speedValue.textContent = text;
      this.rampText.hidden = !s.accelerating;
    }

    /** Aligne le centre de la lettre ORP sur l'axe de fixation. */
    private align(): void {
      if (!this.isOpen_ || !this.settings) return;
      const stageWidth = this.stage.clientWidth;
      if (stageWidth === 0) return;
      const base = this.settings.appearance.fontSize;
      this.wordEl.style.fontSize = `${base}px`;
      const before = this.beforeEl.getBoundingClientRect().width;
      const pivot = this.pivotEl.getBoundingClientRect().width;
      const after = this.afterEl.getBoundingClientRect().width;
      const { offsetX, scale } = computePlacement({
        stageWidth,
        axisX: stageWidth * AXIS_RATIO,
        beforeWidth: before,
        pivotWidth: pivot,
        afterWidth: after,
        padding: 12,
        // Plancher absolu de lisibilité : 16 px.
        minScale: Math.min(1, MIN_RSVP_FONT_PX / base),
      });
      if (scale < 1) this.wordEl.style.fontSize = `${base * scale}px`;
      this.wordEl.style.transform = `translate(${offsetX}px, -50%)`;
    }

    // ───────────────────────── interactions ─────────────────────────

    private onClick(e: MouseEvent): void {
      const button = (e.target as Element).closest?.('[data-action]');
      if (!button || !this.dialog.contains(button)) return;
      const engine = this.host.engine;
      switch ((button as HTMLElement).dataset.action) {
        case 'close':
          this.host.requestClose();
          break;
        case 'toggle':
          engine.toggle('user');
          break;
        case 'prev-word':
          engine.previousWord();
          break;
        case 'next-word':
          engine.nextWord();
          break;
        case 'prev-sentence':
          engine.previousSentence();
          break;
        case 'next-sentence':
          engine.nextSentence();
          break;
        case 'slower':
          this.host.setSpeed(engine.getSpeed() - SPEED.step);
          break;
        case 'faster':
          this.host.setSpeed(engine.getSpeed() + SPEED.step);
          break;
        default:
          break;
      }
    }

    private onKeyDown(e: KeyboardEvent): void {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      const target = deepTarget(e);
      const inText = !!target?.closest?.(TEXT_ENTRY);
      const onInteractive = !!target?.closest?.(INTERACTIVE);
      const inFullText = !!target?.closest?.('.fulltext');
      const inPanel = !!target?.closest?.('.panel');
      const engine = this.host.engine;
      const run = (fn: () => void) => {
        e.preventDefault();
        fn();
      };
      switch (e.key) {
        case 'Escape':
          run(() => {
            if (!this.panel.element.hidden) this.toggleSettings(false);
            else this.host.requestClose();
          });
          return;
        case ' ':
        case 'Spacebar':
          if (!onInteractive && !inFullText) run(() => engine.toggle('user'));
          return;
        case 'k':
        case 'K':
          if (!inText) run(() => engine.toggle('user'));
          return;
        case 'ArrowLeft':
          if (!inText && !inPanel) run(() => (e.shiftKey ? engine.previousSentence() : engine.previousWord()));
          return;
        case 'ArrowRight':
          if (!inText && !inPanel) run(() => (e.shiftKey ? engine.nextSentence() : engine.nextWord()));
          return;
        case 'ArrowUp':
          if (!inText && !inFullText && !inPanel) run(() => this.host.setSpeed(engine.getSpeed() + SPEED.step));
          return;
        case 'ArrowDown':
          if (!inText && !inFullText && !inPanel) run(() => this.host.setSpeed(engine.getSpeed() - SPEED.step));
          return;
        case '+':
        case '=':
          if (!inText) run(() => this.host.setSpeed(engine.getSpeed() + SPEED.step));
          return;
        case '-':
        case '_':
          if (!inText) run(() => this.host.setSpeed(engine.getSpeed() - SPEED.step));
          return;
        case 'PageUp':
        case 'PageDown':
          if (!inFullText && !inPanel) e.preventDefault();
          return;
        case 'Home':
          if (!inText && !inFullText && !inPanel) run(() => engine.seek(0));
          return;
        case 'End':
          if (!inText && !inFullText && !inPanel) run(() => engine.seek(Number.MAX_SAFE_INTEGER));
          return;
        default:
          return;
      }
    }

    /** @internal Accès de test. */
    get parts() {
      return { dialog: this.dialog, stage: this.stage, word: this.wordEl, pivot: this.pivotEl, fullText: this.fullText, panel: this.panel };
    }
  }

  elementClass = ReaderElementImpl;
  return ReaderElementImpl;
}

export const DEFAULT_TAG_NAME = 'urr-reader';

/** Enregistre l'élément personnalisé (idempotent). */
export function defineReaderElement(tagName = DEFAULT_TAG_NAME): string {
  const registry = (globalThis as { customElements?: CustomElementRegistry }).customElements;
  if (!registry) throw new Error('customElements indisponible');
  const existing = registry.get(tagName);
  if (!existing) registry.define(tagName, class extends getElementClass() {});
  return tagName;
}
