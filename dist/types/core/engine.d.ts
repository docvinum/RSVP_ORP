import { type Listener, type Unsubscribe } from './emitter';
import type { NormalizedDocument, Word } from './model';
import { type AccelerationSettings, type TimingCoefficients } from './settings';
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
    status: {
        status: EngineStatus;
        previous: EngineStatus;
        reason?: PauseReason;
    };
    position: EngineSnapshot;
    complete: EngineSnapshot;
    speed: {
        speed: number;
        source: SpeedSource;
    };
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
/**
 * Moteur RSVP indépendant du DOM. Une instance par lecteur.
 *
 * Planification : chaque mot a une échéance `affichage + durée`. Les mots
 * suivants sont planifiés à partir de l'échéance précédente (compensation de
 * dérive). Si la minuterie se réveille avec plus de `maxLagMs` de retard, la
 * planification est recalée sur l'instant présent et ce retard est exclu du
 * temps d'accélération : aucun saut de mots ni de vitesse.
 */
export declare class RsvpEngine {
    private readonly clock;
    private readonly timer;
    private readonly maxLagMs;
    private readonly events;
    private doc;
    private status;
    private index;
    private config;
    private manualSpeed;
    private handle;
    private wordShownAt;
    private deadline;
    private rampActive;
    private rampElapsed;
    private rampSegmentStart;
    private destroyed;
    constructor(options?: EngineOptions);
    on<K extends keyof EngineEvents>(type: K, listener: Listener<EngineEvents[K]>): Unsubscribe;
    /** Charge un document ; la lecture est en pause (`ready`) au mot `startIndex`. */
    load(doc: NormalizedDocument, startIndex?: number): void;
    unload(): void;
    getDocument(): NormalizedDocument | null;
    currentWord(): Word | null;
    /** Démarre ou reprend. Depuis `complete`, recommence au début. Sans effet si déjà en lecture. */
    play(): void;
    /** Reprend depuis `paused` ou `ready` uniquement. */
    resume(): void;
    pause(reason?: PauseReason): void;
    toggle(reason?: PauseReason): void;
    /**
     * Positionne la lecture sur un mot (borné). L'état de lecture est conservé
     * (`playing` continue au nouveau mot) ; depuis `ready` ou `complete`, l'état
     * devient `paused`.
     */
    seek(index: number): void;
    nextWord(): void;
    previousWord(): void;
    /** Début de la phrase suivante (dernier mot s'il n'y en a pas). */
    nextSentence(): void;
    /** Début de la phrase courante, ou de la précédente si déjà au début. */
    previousSentence(): void;
    /**
     * Changement manuel de vitesse (borné et arrondi au pas de 25). Si une
     * accélération est en cours, elle est arrêtée : la vitesse choisie devient
     * fixe pour le reste de la session. Retourne la vitesse appliquée.
     */
    setSpeed(speed: number): number;
    /**
     * Applique de nouveaux réglages. Une modification de l'accélération
     * réarme la montée depuis le début ; la désactiver revient à `speed`.
     */
    configure(config: Partial<EngineConfig>): void;
    getConfig(): EngineConfig;
    /** Vitesse nominale courante, accélération comprise. */
    getSpeed(): number;
    getSnapshot(): EngineSnapshot;
    /** Durée d'affichage du mot courant à la vitesse courante (ms). */
    currentWordDuration(): number;
    /** Arrête toute activité et libère les abonnés. Idempotent. */
    destroy(): void;
    get isDestroyed(): boolean;
    private clampIndex;
    private setStatus;
    private emitPosition;
    private startPlaying;
    /** Affiche le mot courant à l'instant `shownAt` et planifie le suivant. */
    private showCurrent;
    private arm;
    private tick;
    /** Replanifie le mot courant après un changement de vitesse ou de timing. */
    private reschedule;
    private stopTimer;
    private resetRamp;
    private rampElapsedNow;
    private accumulateRamp;
    private updateRampCompletion;
}
