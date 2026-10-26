import { accelerationSpeed } from './acceleration';
import { Emitter, type Listener, type Unsubscribe } from './emitter';
import type { NormalizedDocument, Word } from './model';
import { clampSpeed, createDefaultSettings, type AccelerationSettings, type TimingCoefficients } from './settings';
import { wordDuration } from './timing';

/**
 * États du moteur :
 *
 *   idle ──load──▶ ready ──play──▶ playing ──pause──▶ paused
 *                    │                │  ▲               │
 *                    │                │  └────resume─────┘
 *                    │                └──dernier mot──▶ complete ──play──▶ playing (depuis le début)
 *                    └──seek──▶ paused
 *
 * `unload()` ou `destroy()` ramènent à `idle` depuis n'importe quel état.
 */
export type EngineStatus = 'idle' | 'ready' | 'playing' | 'paused' | 'complete';

/** Horloge monotone (ms). */
export interface Clock {
  now(): number;
}

/** Minuterie injectable (navigateur, Node ou tests). */
export interface Timer {
  set(callback: () => void, delayMs: number): unknown;
  clear(handle: unknown): void;
}

export interface EngineSnapshot {
  status: EngineStatus;
  /** Index du mot courant (−1 sans document). */
  index: number;
  total: number;
  /** Progression 0–1 (1 une fois la lecture terminée). */
  progress: number;
  sentenceIndex: number;
  blockIndex: number;
  /** Vitesse nominale courante (mots/minute). */
  speed: number;
  /** Vrai tant que l'accélération progressive est en cours. */
  accelerating: boolean;
}

export type PauseReason = 'user' | 'api' | 'hidden' | 'close';
export type SpeedSource = 'manual' | 'acceleration' | 'settings';

export interface EngineEvents {
  status: { status: EngineStatus; previous: EngineStatus; reason?: PauseReason };
  position: EngineSnapshot;
  complete: EngineSnapshot;
  speed: { speed: number; source: SpeedSource };
}

export interface EngineConfig {
  speed: number;
  timing: TimingCoefficients;
  acceleration: AccelerationSettings;
}

export interface EngineOptions extends Partial<EngineConfig> {
  clock?: Clock;
  timer?: Timer;
  /**
   * Retard au-delà duquel le moteur considère que l'horloge a été suspendue
   * (onglet en arrière-plan, mise en veille) : il reprend alors au mot
   * suivant sans rattrapage, au lieu d'enchaîner les mots en rafale.
   */
  maxLagMs?: number;
}

const defaultClock: Clock = {
  now: () => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now()),
};

const defaultTimer: Timer = {
  set: (cb, ms) => setTimeout(cb, ms),
  clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
};

/**
 * Moteur RSVP indépendant du DOM. Une instance par lecteur.
 *
 * Planification : chaque mot a une échéance `affichage + durée`. Les mots
 * suivants sont planifiés à partir de l'échéance précédente (compensation de
 * dérive). Si la minuterie se réveille avec plus de `maxLagMs` de retard, la
 * planification est recalée sur l'instant présent et ce retard est exclu du
 * temps d'accélération : aucun saut de mots ni de vitesse.
 */
export class RsvpEngine {
  private readonly clock: Clock;
  private readonly timer: Timer;
  private readonly maxLagMs: number;
  private readonly events = new Emitter<EngineEvents>();

  private doc: NormalizedDocument | null = null;
  private status: EngineStatus = 'idle';
  private index = -1;
  private config: EngineConfig;
  private manualSpeed: number;

  private handle: unknown = null;
  private wordShownAt = 0;
  private deadline = 0;

  // Accélération : temps de lecture effectif cumulé.
  private rampActive = false;
  private rampElapsed = 0;
  private rampSegmentStart = 0;

  private destroyed = false;

  constructor(options: EngineOptions = {}) {
    const defaults = createDefaultSettings();
    this.clock = options.clock ?? defaultClock;
    this.timer = options.timer ?? defaultTimer;
    this.maxLagMs = options.maxLagMs ?? 250;
    this.config = {
      speed: clampSpeed(options.speed ?? defaults.speed),
      timing: { ...(options.timing ?? defaults.timing) },
      acceleration: { ...(options.acceleration ?? defaults.acceleration) },
    };
    this.manualSpeed = this.config.speed;
  }

  // ───────────────────────── abonnement ─────────────────────────

  on<K extends keyof EngineEvents>(type: K, listener: Listener<EngineEvents[K]>): Unsubscribe {
    return this.events.on(type, listener);
  }

  // ───────────────────────── document ─────────────────────────

  /** Charge un document ; la lecture est en pause (`ready`) au mot `startIndex`. */
  load(doc: NormalizedDocument, startIndex = 0): void {
    if (this.destroyed) return;
    this.stopTimer();
    this.doc = doc;
    this.manualSpeed = this.config.speed;
    this.resetRamp();
    if (doc.words.length === 0) {
      this.index = -1;
      this.setStatus('idle');
      return;
    }
    this.index = this.clampIndex(startIndex);
    this.setStatus('ready');
    this.emitPosition();
  }

  unload(): void {
    this.stopTimer();
    this.doc = null;
    this.index = -1;
    this.setStatus('idle');
  }

  getDocument(): NormalizedDocument | null {
    return this.doc;
  }

  currentWord(): Word | null {
    return this.doc?.words[this.index] ?? null;
  }

  // ───────────────────────── lecture ─────────────────────────

  /** Démarre ou reprend. Depuis `complete`, recommence au début. Sans effet si déjà en lecture. */
  play(): void {
    if (!this.doc || this.status === 'idle' || this.status === 'playing') return;
    if (this.status === 'complete') {
      this.index = 0;
      this.resetRamp();
      this.emitPosition();
    }
    this.startPlaying();
  }

  /** Reprend depuis `paused` ou `ready` uniquement. */
  resume(): void {
    if (this.status === 'paused' || this.status === 'ready') this.startPlaying();
  }

  pause(reason: PauseReason = 'api'): void {
    if (this.status !== 'playing') return;
    this.accumulateRamp();
    this.stopTimer();
    this.setStatus('paused', reason);
  }

  toggle(reason: PauseReason = 'api'): void {
    if (this.status === 'playing') this.pause(reason);
    else this.play();
  }

  // ───────────────────────── navigation ─────────────────────────

  /**
   * Positionne la lecture sur un mot (borné). L'état de lecture est conservé
   * (`playing` continue au nouveau mot) ; depuis `ready` ou `complete`, l'état
   * devient `paused`.
   */
  seek(index: number): void {
    if (!this.doc || this.status === 'idle' || !Number.isFinite(index)) return;
    const target = this.clampIndex(Math.trunc(index));
    if (this.status === 'playing') {
      this.stopTimer();
      this.index = target;
      this.emitPosition();
      this.showCurrent(this.clock.now());
      return;
    }
    this.index = target;
    if (this.status === 'ready' || this.status === 'complete') this.setStatus('paused');
    this.emitPosition();
  }

  nextWord(): void {
    this.seek(this.index + 1);
  }

  previousWord(): void {
    this.seek(this.index - 1);
  }

  /** Début de la phrase suivante (dernier mot s'il n'y en a pas). */
  nextSentence(): void {
    const doc = this.doc;
    const word = this.currentWord();
    if (!doc || !word) return;
    const next = doc.sentences[word.sentenceIndex + 1];
    this.seek(next ? next.wordStart : doc.words.length - 1);
  }

  /** Début de la phrase courante, ou de la précédente si déjà au début. */
  previousSentence(): void {
    const doc = this.doc;
    const word = this.currentWord();
    if (!doc || !word) return;
    const current = doc.sentences[word.sentenceIndex]!;
    if (this.index > current.wordStart) this.seek(current.wordStart);
    else this.seek(doc.sentences[word.sentenceIndex - 1]?.wordStart ?? 0);
  }

  // ───────────────────────── vitesse et réglages ─────────────────────────

  /**
   * Changement manuel de vitesse (borné et arrondi au pas de 25). Si une
   * accélération est en cours, elle est arrêtée : la vitesse choisie devient
   * fixe pour le reste de la session. Retourne la vitesse appliquée.
   */
  setSpeed(speed: number): number {
    const value = clampSpeed(speed);
    this.accumulateRamp();
    this.rampActive = false;
    this.manualSpeed = value;
    this.config.speed = value;
    this.reschedule();
    this.events.emit('speed', { speed: value, source: 'manual' });
    return value;
  }

  /**
   * Applique de nouveaux réglages. Une modification de l'accélération
   * réarme la montée depuis le début ; la désactiver revient à `speed`.
   */
  configure(config: Partial<EngineConfig>): void {
    let accelerationChanged = false;
    if (config.timing) this.config.timing = { ...config.timing };
    if (config.acceleration) {
      accelerationChanged = JSON.stringify(config.acceleration) !== JSON.stringify(this.config.acceleration);
      this.config.acceleration = { ...config.acceleration };
    }
    if (config.speed !== undefined) {
      this.config.speed = clampSpeed(config.speed);
      if (!this.rampActive) this.manualSpeed = this.config.speed;
    }
    if (accelerationChanged) {
      this.manualSpeed = this.config.speed;
      this.resetRamp();
    }
    this.reschedule();
    this.events.emit('speed', { speed: this.getSpeed(), source: 'settings' });
  }

  getConfig(): EngineConfig {
    return { speed: this.config.speed, timing: { ...this.config.timing }, acceleration: { ...this.config.acceleration } };
  }

  /** Vitesse nominale courante, accélération comprise. */
  getSpeed(): number {
    if (!this.rampActive) return this.manualSpeed;
    return accelerationSpeed(this.config.acceleration, this.rampElapsedNow());
  }

  getSnapshot(): EngineSnapshot {
    const doc = this.doc;
    const total = doc?.words.length ?? 0;
    const word = this.currentWord();
    return {
      status: this.status,
      index: this.index,
      total,
      progress: total === 0 ? 0 : this.status === 'complete' ? 1 : Math.max(0, this.index) / total,
      sentenceIndex: word?.sentenceIndex ?? -1,
      blockIndex: word?.blockIndex ?? -1,
      speed: this.getSpeed(),
      accelerating: this.rampActive,
    };
  }

  /** Durée d'affichage du mot courant à la vitesse courante (ms). */
  currentWordDuration(): number {
    const word = this.currentWord();
    return word ? wordDuration(word, this.getSpeed(), this.config.timing) : 0;
  }

  /** Arrête toute activité et libère les abonnés. Idempotent. */
  destroy(): void {
    if (this.destroyed) return;
    this.stopTimer();
    this.doc = null;
    this.index = -1;
    this.status = 'idle';
    this.destroyed = true;
    this.events.clear();
  }

  get isDestroyed(): boolean {
    return this.destroyed;
  }

  /** @internal Nombre de minuteries actives (0 ou 1), pour les tests de fuite. */
  get pendingTimers(): number {
    return this.handle === null ? 0 : 1;
  }

  // ───────────────────────── interne ─────────────────────────

  private clampIndex(i: number): number {
    const total = this.doc?.words.length ?? 0;
    return Math.min(Math.max(0, i), Math.max(0, total - 1));
  }

  private setStatus(status: EngineStatus, reason?: PauseReason): void {
    if (status === this.status) return;
    const previous = this.status;
    this.status = status;
    this.events.emit('status', reason ? { status, previous, reason } : { status, previous });
  }

  private emitPosition(): void {
    this.events.emit('position', this.getSnapshot());
  }

  private startPlaying(): void {
    this.rampSegmentStart = this.clock.now();
    this.setStatus('playing');
    this.showCurrent(this.rampSegmentStart);
  }

  /** Affiche le mot courant à l'instant `shownAt` et planifie le suivant. */
  private showCurrent(shownAt: number): void {
    this.wordShownAt = shownAt;
    this.deadline = shownAt + this.currentWordDuration();
    this.arm();
  }

  private arm(): void {
    this.stopTimer();
    const delay = Math.max(0, this.deadline - this.clock.now());
    this.handle = this.timer.set(() => this.tick(), delay);
  }

  private tick(): void {
    this.handle = null;
    if (this.status !== 'playing' || !this.doc) return;
    const now = this.clock.now();
    const lag = now - this.deadline;
    if (this.index >= this.doc.words.length - 1) {
      this.accumulateRamp();
      this.setStatus('complete');
      const snap = this.getSnapshot();
      this.events.emit('position', snap);
      this.events.emit('complete', snap);
      return;
    }
    let shownAt = this.deadline;
    if (lag > this.maxLagMs) {
      // Horloge suspendue : on exclut ce temps de l'accélération et on recale.
      this.rampSegmentStart += lag;
      shownAt = now;
    }
    this.index++;
    this.emitPosition();
    this.updateRampCompletion();
    this.showCurrent(shownAt);
  }

  /** Replanifie le mot courant après un changement de vitesse ou de timing. */
  private reschedule(): void {
    if (this.status !== 'playing') return;
    this.deadline = this.wordShownAt + this.currentWordDuration();
    this.arm();
  }

  private stopTimer(): void {
    if (this.handle !== null) {
      this.timer.clear(this.handle);
      this.handle = null;
    }
  }

  private resetRamp(): void {
    this.rampActive = this.config.acceleration.enabled;
    this.rampElapsed = 0;
    this.rampSegmentStart = this.clock.now();
    if (this.rampActive) this.manualSpeed = this.config.acceleration.startSpeed;
  }

  private rampElapsedNow(): number {
    return this.rampElapsed + (this.status === 'playing' ? this.clock.now() - this.rampSegmentStart : 0);
  }

  private accumulateRamp(): void {
    if (this.status === 'playing') {
      const now = this.clock.now();
      this.rampElapsed += now - this.rampSegmentStart;
      this.rampSegmentStart = now;
    }
  }

  private updateRampCompletion(): void {
    if (this.rampActive && this.rampElapsedNow() >= this.config.acceleration.duration * 1000) {
      this.rampActive = false;
      this.manualSpeed = this.config.acceleration.targetSpeed;
      this.events.emit('speed', { speed: this.manualSpeed, source: 'acceleration' });
    }
  }
}
