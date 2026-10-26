/**
 * Universal RSVP Reader — point d'entrée public.
 *
 * Dépendances runtime embarquées dans le build : markdown-it. Aucun appel
 * réseau, aucun style global, aucune écriture dans le DOM hôte hors de
 * l'élément `<urr-reader>` monté pendant l'ouverture.
 */
export const VERSION: string = __URR_VERSION__;

export { createReader } from './api/reader';
export type {
  CloseReason,
  OpenOptions,
  PersistenceOptions,
  Reader,
  ReaderEventMap,
  ReaderEventType,
  ReaderOptions,
  ReaderPosition,
  ReaderState,
  ReaderStatus,
  SettingsChangeSource,
} from './api/reader';
export { DEFAULT_STORAGE_KEY, PREFERENCES_VERSION, parsePreferences } from './api/preferences';
export type { Preferences, StorageLike } from './api/preferences';

export { ReaderError, isReaderError } from './core/errors';
export type { ReaderErrorCode } from './core/errors';
export type { Listener, Unsubscribe } from './core/emitter';
export type { EngineStatus, PauseReason } from './core/engine';
export type {
  Block,
  BlockKind,
  NormalizedDocument,
  PausePunctuation,
  Sentence,
  Token,
  TokenKind,
  Word,
} from './core/model';
export {
  ACCELERATION_DURATION,
  FONT_SIZE,
  PROFILES,
  SPEED,
  TIMING_BOUNDS,
  TIMING_PRESETS,
  DEFAULT_ORP_COLOR,
} from './core/settings';
export type {
  AccelerationCurve,
  AccelerationSettings,
  AppearanceSettings,
  FontId,
  ProfileId,
  ReaderSettings,
  SettingsPatch,
  SettingsSection,
  ThemeId,
  TimingCoefficients,
  TimingLevel,
} from './core/settings';
export { splitOrp } from './core/orp';
export type { OrpSplit } from './core/orp';
export { wordDuration } from './core/timing';
export { parseSource } from './parsers';
export type { ParseOptions, ReaderSource } from './parsers';
export { LABELS_EN, LABELS_FR } from './ui/labels';
export type { Labels } from './ui/labels';
export { DEFAULT_TAG_NAME, defineReaderElement } from './ui/reader-element';
