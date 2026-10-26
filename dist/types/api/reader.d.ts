import { type Listener, type Unsubscribe } from '../core/emitter';
import { type EngineStatus, type PauseReason } from '../core/engine';
import { ReaderError } from '../core/errors';
import type { NormalizedDocument } from '../core/model';
import { type ReaderSettings, type SettingsPatch, type SettingsSection } from '../core/settings';
import { type ReaderSource } from '../parsers';
import { type LabelLocale, type Labels } from '../ui/labels';
import { type Preferences, type StorageLike } from './preferences';
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
export type CloseReason = 'user' | 'api' | 'superseded' | 'destroy' | 'detached' | 'error';
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
    open: {
        title: string;
        wordCount: number;
        sentenceCount: number;
        sourceType: ReaderSource['type'];
    };
    play: ReaderPosition;
    pause: ReaderPosition & {
        reason: PauseReason;
    };
    progress: ReaderPosition;
    complete: ReaderPosition;
    close: {
        reason: CloseReason;
        position: ReaderPosition | null;
    };
    error: {
        error: ReaderError;
    };
    'settings-change': {
        settings: ReaderSettings;
        changed: SettingsSection[];
        source: SettingsChangeSource;
    };
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
/**
 * Crée un lecteur. Chaque lecteur possède un unique moteur et un unique
 * composant d'interface, créé à la première ouverture.
 */
export declare function createReader(options?: ReaderOptions): Reader;
