import { normalizeSettings, structuredCloneSettings, type ReaderSettings } from '../core/settings';

/**
 * Préférences utilisateur persistables. Elles ne contiennent que des
 * réglages : jamais de texte source, de contenu lu, de position ni
 * d'historique.
 */
export interface Preferences {
  version: typeof PREFERENCES_VERSION;
  settings: ReaderSettings;
}

/** Version du schéma ; incrémentée à chaque changement incompatible. */
export const PREFERENCES_VERSION = 1 as const;
export const DEFAULT_STORAGE_KEY = 'urr:prefs:v1';

/** Sous-ensemble de l'API `Storage` utilisé (permet un stockage fourni par l'hôte). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export function toPreferences(settings: ReaderSettings): Preferences {
  return { version: PREFERENCES_VERSION, settings: structuredCloneSettings(settings) };
}

/**
 * Valide des préférences (objet ou chaîne JSON). Retourne `null` si elles
 * sont illisibles ou d'une version inconnue ; les champs invalides d'une
 * version connue sont remplacés par leurs valeurs par défaut.
 * Point d'extension des migrations : `version < PREFERENCES_VERSION`.
 */
export function parsePreferences(input: unknown): ReaderSettings | null {
  let value = input;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  if (typeof value !== 'object' || value === null) return null;
  const { version, settings } = value as { version?: unknown; settings?: unknown };
  if (version !== PREFERENCES_VERSION) return null;
  return normalizeSettings(settings);
}

export function resolveStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  try {
    return (globalThis as { localStorage?: StorageLike }).localStorage ?? null;
  } catch {
    // Accès refusé (navigation privée, iframe sandboxée…).
    return null;
  }
}

export function readStoredPreferences(storage: StorageLike, key: string): ReaderSettings | null {
  const raw = storage.getItem(key);
  return raw === null ? null : parsePreferences(raw);
}

export function writeStoredPreferences(storage: StorageLike, key: string, settings: ReaderSettings): void {
  storage.setItem(key, JSON.stringify(toPreferences(settings)));
}
