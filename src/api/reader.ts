import { Emitter, type Listener, type Unsubscribe } from '../core/emitter';
import { RsvpEngine, type Clock, type EngineSnapshot, type EngineStatus, type PauseReason, type Timer } from '../core/engine';
import { ReaderError } from '../core/errors';
import type { NormalizedDocument } from '../core/model';
import {
  applySettingsPatch,
  clampSpeed,
  createDefaultSettings,
  normalizeSettings,
  structuredCloneSettings,
  type ReaderSettings,
  type SettingsPatch,
  type SettingsSection,
} from '../core/settings';
import { parseSource, type ReaderSource } from '../parsers';
import { resolveLabels, type LabelLocale, type Labels } from '../ui/labels';
import { DEFAULT_TAG_NAME, defineReaderElement, type ReaderElement, type ReaderViewHost } from '../ui/reader-element';
import {
  DEFAULT_STORAGE_KEY,
  parsePreferences,
  readStoredPreferences,
  resolveStorage,
  toPreferences,
  writeStoredPreferences,
  type Preferences,
  type StorageLike,
} from './preferences';

// ───────────────────────── types publics ─────────────────────────

export interface PersistenceOptions {
  /** Active la persistance locale des préférences. Défaut : `false` (aucune écriture). */
  enabled?: boolean;
  /** Clé de stockage. Défaut : `urr:prefs:v1`. */
  storageKey?: string;
  /** Stockage à utiliser. Défaut : `localStorage`. */
  storage?: StorageLike;
}

export interface ReaderOptions {
  /** Réglages initiaux souhaités par l'hôte (appliqués avant les préférences). */
  settings?: SettingsPatch;
  /** Préférences fournies par l'hôte (prioritaires sur le stockage local). */
  preferences?: Preferences | string;
  persistence?: PersistenceOptions;
  /** Langue de l'interface. Défaut : `fr`. */
  uiLocale?: LabelLocale;
  /** Surcharge de libellés. */
  labels?: Partial<Labels>;
  /** Langue du contenu par défaut (segmentation). Défaut : attribut `lang` de la source DOM, sinon `fr`. */
  contentLocale?: string;
  /** Sélecteur CSS de contenus à exclure (sources `html` et `dom`). */
  exclude?: string;
  /** Élément où monter le lecteur. Défaut : `document.body`. */
  container?: HTMLElement;
  /** Nom de l'élément personnalisé. Défaut : `urr-reader`. */
  tagName?: string;
  /** Un clic sur un mot du texte intégral lance la lecture au lieu de la laisser en pause. Défaut : `false`. */
  resumeOnWordClick?: boolean;
  /** Met la lecture en pause quand l'onglet devient invisible. Défaut : `true`. */
  pauseWhenHidden?: boolean;
  /** Lance la lecture à l'ouverture. Défaut : `false`. */
  autoPlay?: boolean;
  /** Restaure le focus sur l'élément actif avant l'ouverture. Défaut : `true`. */
  restoreFocus?: boolean;
  /** @internal Horloge et minuterie (tests). */
  clock?: Clock;
  /** @internal */
  timer?: Timer;
}

export interface OpenOptions {
  /** Titre du dialogue. Défaut : premier titre du contenu, sinon libellé « Lecture rapide ». */
  title?: string;
  /** Index du mot de départ. */
  startAt?: number;
  autoPlay?: boolean;
  contentLocale?: string;
  exclude?: string;
}

export interface ReaderPosition {
  index: number;
  total: number;
  progress: number;
  sentenceIndex: number;
  blockIndex: number;
  /** Vitesse nominale courante (mots/minute). */
  speed: number;
}

export type ReaderStatus = 'closed' | 'ready' | 'playing' | 'paused' | 'complete' | 'destroyed';
export type CloseReason = 'user' | 'api' | 'superseded' | 'destroy' | 'detached';
export type SettingsChangeSource = 'user' | 'api' | 'preferences';

export interface ReaderState {
  status: ReaderStatus;
  engineStatus: EngineStatus;
  isOpen: boolean;
  position: ReaderPosition | null;
  speed: number;
  accelerating: boolean;
  title: string | null;
}

export interface ReaderEventMap {
  open: { title: string; wordCount: number; sentenceCount: number; sourceType: ReaderSource['type'] };
  play: ReaderPosition;
  pause: ReaderPosition & { reason: PauseReason };
  progress: ReaderPosition;
  complete: ReaderPosition;
  close: { reason: CloseReason; position: ReaderPosition | null };
  error: { error: ReaderError };
  'settings-change': { settings: ReaderSettings; changed: SettingsSection[]; source: SettingsChangeSource };
}

export type ReaderEventType = keyof ReaderEventMap;

export interface Reader {
  /** Ouvre le lecteur sur une source. Rejette avec une `ReaderError` en cas d'échec. */
  open(source: ReaderSource, options?: OpenOptions): Promise<void>;
  play(): void;
  pause(): void;
  resume(): void;
  toggle(): void;
  seek(index: number): void;
  nextWord(): void;
  previousWord(): void;
  nextSentence(): void;
  previousSentence(): void;
  /** Vitesse bornée [150, 900], arrondie au pas de 25 ; arrête une accélération en cours. Retourne la vitesse appliquée. */
  setSpeed(wordsPerMinute: number): number;
  close(): void;
  destroy(): void;

  getState(): ReaderState;
  getPosition(): ReaderPosition | null;
  getSettings(): ReaderSettings;
  updateSettings(patch: SettingsPatch): ReaderSettings;
  resetSettings(): ReaderSettings;
  getPreferences(): Preferences;
  /** Applique des préférences ; retourne `false` si elles sont invalides. */
  setPreferences(preferences: Preferences | string): boolean;
  getDocument(): NormalizedDocument | null;

  on<K extends ReaderEventType>(type: K, listener: Listener<ReaderEventMap[K]>): Unsubscribe;
  off<K extends ReaderEventType>(type: K, listener: Listener<ReaderEventMap[K]>): void;
  once<K extends ReaderEventType>(type: K, listener: Listener<ReaderEventMap[K]>): Unsubscribe;

  readonly isOpen: boolean;
  readonly isDestroyed: boolean;
}

// ───────────────────────── implémentation ─────────────────────────

/** Lecteur actuellement ouvert : un seul dialogue modal à la fois dans la page. */
let activeReader: ReaderImpl | null = null;

const SECTIONS: readonly SettingsSection[] = ['profile', 'speed', 'timing', 'acceleration', 'appearance'];

function toPosition(s: EngineSnapshot): ReaderPosition | null {
  if (s.index < 0) return null;
  return { index: s.index, total: s.total, progress: s.progress, sentenceIndex: s.sentenceIndex, blockIndex: s.blockIndex, speed: s.speed };
}

function deepActiveElement(doc: Document): HTMLElement | null {
  let active: Element | null = doc.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active instanceof HTMLElement && active !== doc.body ? active : null;
}

class ReaderImpl implements Reader {
  readonly engine: RsvpEngine;
  readonly labels: Labels;
  private readonly events = new Emitter<ReaderEventMap>();
  private readonly options: ReaderOptions;
  private settings: ReaderSettings;
  private storage: StorageLike | null = null;
  private readonly storageKey: string;
  private element: ReaderElement | null = null;
  private open_ = false;
  private destroyed = false;
  private title: string | null = null;
  private restoreTarget: HTMLElement | null = null;
  private savedScroll: { x: number; y: number } | null = null;
  private visibilityHandler: (() => void) | null = null;
  /** Actions de l'interface : elles agissent au nom de l'utilisateur (source « user »). */
  private readonly viewHost: ReaderViewHost;

  constructor(options: ReaderOptions = {}) {
    this.options = options;
    this.labels = resolveLabels(options.uiLocale ?? 'fr', options.labels);
    this.storageKey = options.persistence?.storageKey ?? DEFAULT_STORAGE_KEY;

    // Ordre : défauts → réglages de l'hôte → préférences (fournies, sinon stockées).
    let settings = createDefaultSettings();
    if (options.settings) settings = applySettingsPatch(settings, options.settings).settings;
    let prefs: ReaderSettings | null = null;
    if (options.preferences !== undefined) prefs = parsePreferences(options.preferences);
    if (options.persistence?.enabled) {
      this.storage = resolveStorage(options.persistence.storage);
      if (!prefs && this.storage) {
        try {
          prefs = readStoredPreferences(this.storage, this.storageKey);
        } catch (error) {
          this.reportStorageError(error);
        }
      }
    }
    this.settings = prefs ?? settings;

    this.engine = new RsvpEngine({
      speed: this.settings.speed,
      timing: this.settings.timing,
      acceleration: this.settings.acceleration,
      ...(options.clock ? { clock: options.clock } : {}),
      ...(options.timer ? { timer: options.timer } : {}),
    });
    this.viewHost = {
      engine: this.engine,
      labels: this.labels,
      getSettings: () => this.getSettings(),
      updateSettings: (patch) => void this.patch(patch, 'user'),
      resetSettings: () => void this.replace(createDefaultSettings(), 'user'),
      setSpeed: (speed) => void this.applySpeed(speed, 'user'),
      activateWord: (index) => {
        this.engine.seek(index);
        if (this.options.resumeOnWordClick) this.engine.play();
        else this.engine.pause('user');
      },
      requestClose: () => this.closeWith('user'),
      onDisconnected: () => this.closeWith('detached'),
    };
    this.engine.on('status', ({ status, previous, reason }) => {
      const pos = this.getPosition();
      if (!pos) return;
      if (status === 'playing') this.emit('play', pos);
      else if (status === 'paused' && previous === 'playing') this.emit('pause', { ...pos, reason: reason ?? 'api' });
      else if (status === 'complete') this.emit('complete', pos);
    });
    this.engine.on('position', (s) => {
      const pos = toPosition(s);
      if (pos) this.emit('progress', pos);
    });
  }

  // ───────────── événements ─────────────

  on<K extends ReaderEventType>(type: K, listener: Listener<ReaderEventMap[K]>): Unsubscribe {
    if (this.destroyed) return () => {};
    return this.events.on(type, listener);
  }

  off<K extends ReaderEventType>(type: K, listener: Listener<ReaderEventMap[K]>): void {
    this.events.off(type, listener);
  }

  once<K extends ReaderEventType>(type: K, listener: Listener<ReaderEventMap[K]>): Unsubscribe {
    const off = this.on(type, (payload) => {
      off();
      listener(payload);
    });
    return off;
  }

  private emit<K extends ReaderEventType>(type: K, payload: ReaderEventMap[K]): void {
    this.events.emit(type, payload, (error) => {
      // Une erreur d'abonné ne doit pas interrompre la lecture.
      if (type !== 'error') this.emit('error', { error: new ReaderError('LISTENER', `Erreur dans un abonné à « ${type} ».`, { cause: error }) });
    });
  }

  // ───────────── ouverture / fermeture ─────────────

  async open(source: ReaderSource, options: OpenOptions = {}): Promise<void> {
    if (this.destroyed) throw this.fail(new ReaderError('DESTROYED', 'Ce lecteur a été détruit.'));
    const doc = this.checkEnvironment();
    let parsed: NormalizedDocument;
    try {
      const locale = options.contentLocale ?? this.options.contentLocale;
      const exclude = options.exclude ?? this.options.exclude;
      parsed = parseSource(source, { ...(locale ? { locale } : {}), ...(exclude ? { exclude } : {}) });
    } catch (error) {
      throw this.fail(error instanceof ReaderError ? error : new ReaderError('PARSE_ERROR', 'Impossible d’extraire le contenu.', { cause: error }));
    }

    if (activeReader && activeReader !== this) activeReader.closeWith('superseded');
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- registre module des lecteurs ouverts
    activeReader = this;

    // Réouverture pendant la lecture : la lecture en cours est d'abord suspendue (événement pause).
    if (this.open_) this.engine.pause('api');
    if (!this.open_) {
      this.restoreTarget = this.options.restoreFocus === false ? null : deepActiveElement(doc);
      const view = doc.defaultView;
      this.savedScroll = view ? { x: view.scrollX, y: view.scrollY } : null;
    }

    const firstHeading = parsed.blocks.find((b) => b.kind === 'heading');
    this.title = options.title ?? (firstHeading ? parsed.text.slice(firstHeading.start, firstHeading.end) : this.labels.dialogTitle);

    this.engine.load(parsed, options.startAt ?? 0);
    const element = this.ensureElement(doc);
    const container = this.options.container?.isConnected ? this.options.container : doc.body;
    if (element.parentNode !== container) container.append(element);
    element.open(parsed, this.title);
    this.open_ = true;
    this.listenVisibility(doc);

    this.emit('open', { title: this.title, wordCount: parsed.words.length, sentenceCount: parsed.sentences.length, sourceType: source.type });
    if (options.autoPlay ?? this.options.autoPlay) this.engine.play();
  }

  close(): void {
    this.closeWith('api');
  }

  /** @internal */
  closeWith(reason: CloseReason): void {
    if (!this.open_) return;
    this.open_ = false;
    this.engine.pause('close');
    const position = this.getPosition();
    this.engine.unload();
    if (this.visibilityHandler) {
      this.element?.ownerDocument.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    const element = this.element;
    if (element) {
      element.close();
      element.remove();
    }
    if (activeReader === this) activeReader = null;
    this.restoreHost();
    this.title = null;
    this.emit('close', { reason, position });
  }

  destroy(): void {
    if (this.destroyed) return;
    this.closeWith('destroy');
    this.destroyed = true;
    this.engine.destroy();
    this.element?.teardown();
    this.element = null;
    this.events.clear();
  }

  private restoreHost(): void {
    const target = this.restoreTarget;
    this.restoreTarget = null;
    const scroll = this.savedScroll;
    this.savedScroll = null;
    if (target?.isConnected) {
      try {
        target.focus({ preventScroll: true });
      } catch {
        // Élément non focalisable : ignoré.
      }
    }
    const view = this.element?.ownerDocument.defaultView ?? (typeof window !== 'undefined' ? window : null);
    if (scroll && view && (view.scrollX !== scroll.x || view.scrollY !== scroll.y)) view.scrollTo(scroll.x, scroll.y);
  }

  private checkEnvironment(): Document {
    const doc = (globalThis as { document?: Document }).document;
    const ok =
      !!doc &&
      typeof (globalThis as { customElements?: unknown }).customElements !== 'undefined' &&
      typeof (globalThis as { HTMLDialogElement?: { prototype: { showModal?: unknown } } }).HTMLDialogElement?.prototype.showModal === 'function';
    if (!ok) throw this.fail(new ReaderError('ENVIRONMENT', 'Le lecteur nécessite un navigateur prenant en charge les Web Components et <dialog>.'));
    return doc;
  }

  private ensureElement(doc: Document): ReaderElement {
    if (this.element) return this.element;
    const tag = defineReaderElement(this.options.tagName ?? DEFAULT_TAG_NAME);
    const el = doc.createElement(tag) as ReaderElement;
    if (typeof el.attach !== 'function') {
      throw this.fail(new ReaderError('ENVIRONMENT', `L'élément <${tag}> est déjà défini par un autre script.`));
    }
    el.attach(this.viewHost);
    this.element = el;
    return el;
  }

  private listenVisibility(doc: Document): void {
    if (this.visibilityHandler || this.options.pauseWhenHidden === false) return;
    this.visibilityHandler = () => {
      if (doc.visibilityState === 'hidden') this.engine.pause('hidden');
    };
    doc.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private fail(error: ReaderError): ReaderError {
    this.emit('error', { error });
    return error;
  }

  // ───────────── commandes ─────────────

  play(): void {
    if (this.open_) this.engine.play();
  }

  pause(): void {
    this.engine.pause('api');
  }

  resume(): void {
    if (this.open_) this.engine.resume();
  }

  toggle(): void {
    if (this.open_) this.engine.toggle('api');
  }

  seek(index: number): void {
    this.engine.seek(index);
  }

  nextWord(): void {
    this.engine.nextWord();
  }

  previousWord(): void {
    this.engine.previousWord();
  }

  nextSentence(): void {
    this.engine.nextSentence();
  }

  previousSentence(): void {
    this.engine.previousSentence();
  }

  setSpeed(wordsPerMinute: number): number {
    return this.applySpeed(wordsPerMinute, 'api');
  }

  private applySpeed(wordsPerMinute: number, source: SettingsChangeSource): number {
    if (this.destroyed) return this.settings.speed;
    const value = clampSpeed(wordsPerMinute);
    this.engine.setSpeed(value);
    this.commit(applySettingsPatch(this.settings, { speed: value }), source, false);
    return value;
  }

  // ───────────── réglages ─────────────

  getSettings(): ReaderSettings {
    return structuredCloneSettings(this.settings);
  }

  updateSettings(patch: SettingsPatch): ReaderSettings {
    return this.patch(patch, 'api');
  }

  resetSettings(): ReaderSettings {
    return this.replace(createDefaultSettings(), 'api');
  }

  getPreferences(): Preferences {
    return toPreferences(this.settings);
  }

  setPreferences(preferences: Preferences | string): boolean {
    const settings = parsePreferences(preferences);
    if (!settings) return false;
    this.replace(settings, 'preferences');
    return true;
  }

  private patch(patch: SettingsPatch, source: SettingsChangeSource): ReaderSettings {
    if (this.destroyed) return this.getSettings();
    return this.commit(applySettingsPatch(this.settings, patch), source, true);
  }

  private replace(next: ReaderSettings, source: SettingsChangeSource): ReaderSettings {
    if (this.destroyed) return this.getSettings();
    const settings = normalizeSettings(next);
    const changed = SECTIONS.filter((k) => JSON.stringify(settings[k]) !== JSON.stringify(this.settings[k]));
    return this.commit({ settings, changed }, source, true);
  }

  private commit(result: { settings: ReaderSettings; changed: SettingsSection[] }, source: SettingsChangeSource, configureSpeed: boolean): ReaderSettings {
    const { settings, changed } = result;
    if (changed.length === 0) return this.getSettings();
    this.settings = settings;
    if (changed.includes('timing') || changed.includes('acceleration')) {
      // `configure` applique aussi la vitesse (et réarme l'accélération si elle a changé).
      this.engine.configure({ timing: settings.timing, acceleration: settings.acceleration, speed: settings.speed });
    } else if (configureSpeed && changed.includes('speed')) {
      this.engine.setSpeed(settings.speed);
    }
    this.element?.applySettings(settings);
    this.persist();
    this.emit('settings-change', { settings: this.getSettings(), changed, source });
    return this.getSettings();
  }

  private persist(): void {
    if (!this.options.persistence?.enabled || !this.storage) return;
    try {
      writeStoredPreferences(this.storage, this.storageKey, this.settings);
    } catch (error) {
      this.reportStorageError(error);
    }
  }

  private reportStorageError(cause: unknown): void {
    this.emit('error', { error: new ReaderError('STORAGE', 'Préférences : stockage indisponible.', { cause, fatal: false }) });
  }

  // ───────────── état ─────────────

  getState(): ReaderState {
    const s = this.engine.getSnapshot();
    const status: ReaderStatus = this.destroyed ? 'destroyed' : !this.open_ ? 'closed' : s.status === 'idle' ? 'closed' : s.status;
    return {
      status,
      engineStatus: s.status,
      isOpen: this.open_,
      position: toPosition(s),
      speed: s.speed,
      accelerating: s.accelerating,
      title: this.title,
    };
  }

  getPosition(): ReaderPosition | null {
    return toPosition(this.engine.getSnapshot());
  }

  getDocument(): NormalizedDocument | null {
    return this.engine.getDocument();
  }

  get isOpen(): boolean {
    return this.open_;
  }

  get isDestroyed(): boolean {
    return this.destroyed;
  }
}

/**
 * Crée un lecteur. Chaque lecteur possède un unique moteur et un unique
 * composant d'interface, créé à la première ouverture.
 */
export function createReader(options: ReaderOptions = {}): Reader {
  return new ReaderImpl(options);
}
