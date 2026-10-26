/**
 * Réglages du lecteur : types, valeurs par défaut, profils, validation et
 * application de modifications. Toutes les valeurs sont bornées ; aucune
 * entrée (options, préférences stockées, saisie utilisateur) n'est utilisée
 * sans passer par ce module.
 */
export type ProfileId = 'comfort' | 'standard' | 'fast' | 'custom';
export type PresetProfileId = Exclude<ProfileId, 'custom'>;
export type TimingLevel = 'light' | 'normal' | 'strong';
export type FontId = 'sans' | 'serif' | 'mono' | 'readable';
export type ThemeId = 'auto' | 'light' | 'dark';
export type AccelerationCurve = 'linear' | 'ease-in-out';
/** Coefficients de pause (multiplicateurs de la durée nominale d'un mot). */
export interface TimingCoefficients {
    /** Mot suivi d'une virgule. */
    comma: number;
    /** Mot suivi d'un point-virgule, de deux-points ou d'un tiret. */
    clause: number;
    /** Fin de phrase (. ! ? …). */
    sentence: number;
    /** Fin de paragraphe ou de bloc (remplace la pause de phrase si plus forte). */
    paragraph: number;
    /** Nombre de lettres à partir duquel un mot est considéré long. */
    longWordThreshold: number;
    /** Supplément de durée par lettre au-delà du seuil (0,05 = +5 %). */
    longWordStep: number;
    /** Supplément maximal pour un mot long (0,5 = +50 %). */
    longWordMaxExtra: number;
}
export interface AccelerationSettings {
    enabled: boolean;
    /** Vitesse de départ (mots/minute). */
    startSpeed: number;
    /** Vitesse cible (mots/minute), ≥ `startSpeed`, ≤ 900. */
    targetSpeed: number;
    /** Durée de montée, en secondes de lecture effective. */
    duration: number;
    curve: AccelerationCurve;
}
export interface AppearanceSettings {
    /** Couleur de la lettre ORP, format `#rrggbb`. */
    orpColor: string;
    /** Taille de police du mot RSVP, en pixels CSS. */
    fontSize: number;
    fontFamily: FontId;
    /** Affiche les repères de fixation au-dessus et au-dessous de la lettre ORP. */
    showGuides: boolean;
    theme: ThemeId;
}
export interface ReaderSettings {
    profile: ProfileId;
    /** Vitesse nominale courante (mots/minute). */
    speed: number;
    /** Niveau de pauses ; `custom` si les coefficients ne correspondent à aucun niveau. */
    timingLevel: TimingLevel | 'custom';
    timing: TimingCoefficients;
    acceleration: AccelerationSettings;
    appearance: AppearanceSettings;
}
export interface SettingsPatch {
    profile?: ProfileId;
    speed?: number;
    timingLevel?: TimingLevel;
    timing?: Partial<TimingCoefficients>;
    acceleration?: Partial<AccelerationSettings>;
    appearance?: Partial<AppearanceSettings>;
}
export type SettingsSection = 'profile' | 'speed' | 'timing' | 'acceleration' | 'appearance';
interface NumberBounds {
    min: number;
    max: number;
    step?: number;
    default: number;
}
export declare const SPEED: Readonly<NumberBounds & {
    step: number;
}>;
export declare const FONT_SIZE: Readonly<NumberBounds>;
export declare const ACCELERATION_DURATION: Readonly<NumberBounds>;
export declare const TIMING_BOUNDS: Readonly<Record<keyof TimingCoefficients, Readonly<NumberBounds>>>;
/** Niveaux de pauses prédéfinis (immuables). */
export declare const TIMING_PRESETS: Readonly<Record<TimingLevel, Readonly<TimingCoefficients>>>;
export interface ProfilePreset {
    speed: number;
    timingLevel: TimingLevel;
}
/**
 * Profils prédéfinis (immuables). Les vitesses sont des paramètres de produit,
 * pas des affirmations sur les capacités de lecture.
 */
export declare const PROFILES: Readonly<Record<PresetProfileId, Readonly<ProfilePreset>>>;
export declare const FONT_IDS: readonly FontId[];
export declare const THEME_IDS: readonly ThemeId[];
export declare const PROFILE_IDS: readonly ProfileId[];
export declare const TIMING_LEVELS: readonly TimingLevel[];
export declare const DEFAULT_ORP_COLOR = "#d32f2f";
/** Borne un nombre ; arrondit au pas si fourni. Valeur invalide → défaut. */
export declare function clampNumber(value: unknown, bounds: NumberBounds): number;
/** Vitesse bornée à [150, 900] et arrondie au pas de 25. */
export declare function clampSpeed(value: unknown): number;
export declare function normalizeColor(value: unknown, fallback?: string): string;
export declare function normalizeTiming(input: unknown, base?: TimingCoefficients): TimingCoefficients;
export declare function normalizeAcceleration(input: unknown, base?: AccelerationSettings): AccelerationSettings;
export declare function normalizeAppearance(input: unknown, base?: AppearanceSettings): AppearanceSettings;
/** Niveau correspondant exactement à des coefficients, sinon `custom`. */
export declare function detectTimingLevel(timing: TimingCoefficients): TimingLevel | 'custom';
/** Réglages complets d'un profil prédéfini. */
export declare function profileSettings(id: PresetProfileId, appearance?: AppearanceSettings, acceleration?: AccelerationSettings): ReaderSettings;
export declare function createDefaultSettings(): ReaderSettings;
/** Vrai si les réglages de lecture correspondent exactement au profil prédéfini. */
export declare function matchesProfile(s: ReaderSettings, id: PresetProfileId): boolean;
/**
 * Valide un objet de réglages quelconque (options, préférences stockées).
 * Les champs invalides prennent leur valeur par défaut. Un profil prédéfini
 * dont les réglages ne correspondent plus devient `custom`.
 */
export declare function normalizeSettings(input: unknown): ReaderSettings;
export interface PatchResult {
    settings: ReaderSettings;
    changed: SettingsSection[];
}
/**
 * Applique une modification. Règles :
 * - `profile` prédéfini : charge le profil (vitesse, pauses, accélération
 *   désactivée) avant d'appliquer le reste du patch ;
 * - toute modification effective de `timingLevel`, `timing` ou
 *   `acceleration` sur un profil prédéfini bascule vers `custom` ;
 * - `speed` et `appearance` ne changent jamais le profil (la vitesse est un
 *   réglage de session ajustable à tout moment, voir docs/profiles-and-timing.md).
 * Les réglages d'origine ne sont jamais modifiés.
 */
export declare function applySettingsPatch(current: ReaderSettings, patch: SettingsPatch): PatchResult;
export declare function structuredCloneSettings(s: ReaderSettings): ReaderSettings;
export {};
