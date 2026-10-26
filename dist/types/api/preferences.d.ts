import { type ReaderSettings } from '../core/settings';
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
export declare const PREFERENCES_VERSION: 1;
export declare const DEFAULT_STORAGE_KEY = "urr:prefs:v1";
/** Sous-ensemble de l'API `Storage` utilisé (permet un stockage fourni par l'hôte). */
export interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem?(key: string): void;
}
export declare function toPreferences(settings: ReaderSettings): Preferences;
/**
 * Valide des préférences (objet ou chaîne JSON). Retourne `null` si elles
 * sont illisibles ou d'une version inconnue ; les champs invalides d'une
 * version connue sont remplacés par leurs valeurs par défaut.
 * Point d'extension des migrations : `version < PREFERENCES_VERSION`.
 */
export declare function parsePreferences(input: unknown): ReaderSettings | null;
export declare function resolveStorage(storage?: StorageLike): StorageLike | null;
export declare function readStoredPreferences(storage: StorageLike, key: string): ReaderSettings | null;
export declare function writeStoredPreferences(storage: StorageLike, key: string, settings: ReaderSettings): void;
