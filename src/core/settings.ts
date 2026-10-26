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

export const SPEED: Readonly<NumberBounds & { step: number }> = Object.freeze({ min: 150, max: 900, step: 25, default: 250 });
export const FONT_SIZE: Readonly<NumberBounds> = Object.freeze({ min: 24, max: 96, step: 2, default: 48 });
export const ACCELERATION_DURATION: Readonly<NumberBounds> = Object.freeze({ min: 5, max: 600, step: 5, default: 60 });

export const TIMING_BOUNDS: Readonly<Record<keyof TimingCoefficients, Readonly<NumberBounds>>> = Object.freeze({
  comma: { min: 1, max: 4, step: 0.05, default: 1.5 },
  clause: { min: 1, max: 5, step: 0.05, default: 1.75 },
  sentence: { min: 1, max: 6, step: 0.05, default: 2.25 },
  paragraph: { min: 1, max: 8, step: 0.05, default: 3 },
  longWordThreshold: { min: 4, max: 20, step: 1, default: 8 },
  longWordStep: { min: 0, max: 0.25, step: 0.01, default: 0.05 },
  longWordMaxExtra: { min: 0, max: 2, step: 0.05, default: 0.5 },
});

/** Niveaux de pauses prédéfinis (immuables). */
export const TIMING_PRESETS: Readonly<Record<TimingLevel, Readonly<TimingCoefficients>>> = Object.freeze({
  light: Object.freeze({ comma: 1.2, clause: 1.4, sentence: 1.6, paragraph: 2, longWordThreshold: 10, longWordStep: 0.03, longWordMaxExtra: 0.3 }),
  normal: Object.freeze({ comma: 1.5, clause: 1.75, sentence: 2.25, paragraph: 3, longWordThreshold: 8, longWordStep: 0.05, longWordMaxExtra: 0.5 }),
  strong: Object.freeze({ comma: 1.8, clause: 2.2, sentence: 2.8, paragraph: 4, longWordThreshold: 7, longWordStep: 0.08, longWordMaxExtra: 0.8 }),
});

export interface ProfilePreset {
  speed: number;
  timingLevel: TimingLevel;
}

/**
 * Profils prédéfinis (immuables). Les vitesses sont des paramètres de produit,
 * pas des affirmations sur les capacités de lecture.
 */
export const PROFILES: Readonly<Record<PresetProfileId, Readonly<ProfilePreset>>> = Object.freeze({
  comfort: Object.freeze({ speed: 200, timingLevel: 'strong' as const }),
  standard: Object.freeze({ speed: 250, timingLevel: 'normal' as const }),
  fast: Object.freeze({ speed: 400, timingLevel: 'light' as const }),
});

export const FONT_IDS: readonly FontId[] = Object.freeze(['sans', 'serif', 'mono', 'readable']);
export const THEME_IDS: readonly ThemeId[] = Object.freeze(['auto', 'light', 'dark']);
export const PROFILE_IDS: readonly ProfileId[] = Object.freeze(['comfort', 'standard', 'fast', 'custom']);
export const TIMING_LEVELS: readonly TimingLevel[] = Object.freeze(['light', 'normal', 'strong']);

export const DEFAULT_ORP_COLOR = '#d32f2f';

const DEFAULT_ACCELERATION: Readonly<AccelerationSettings> = Object.freeze({
  enabled: false,
  startSpeed: 250,
  targetSpeed: 400,
  duration: ACCELERATION_DURATION.default,
  curve: 'linear',
});

const DEFAULT_APPEARANCE: Readonly<AppearanceSettings> = Object.freeze({
  orpColor: DEFAULT_ORP_COLOR,
  fontSize: FONT_SIZE.default,
  fontFamily: 'sans',
  showGuides: true,
  theme: 'auto',
});

function finite(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

/** Borne un nombre ; arrondit au pas si fourni. Valeur invalide → défaut. */
export function clampNumber(value: unknown, bounds: NumberBounds): number {
  const n = finite(value);
  if (n === undefined) return bounds.default;
  let v = Math.min(bounds.max, Math.max(bounds.min, n));
  if (bounds.step) {
    v = bounds.min + Math.round((v - bounds.min) / bounds.step) * bounds.step;
    v = Math.min(bounds.max, v);
    // Évite les artefacts flottants (1.2000000000000002).
    v = Number(v.toFixed(4));
  }
  return v;
}

/** Vitesse bornée à [150, 900] et arrondie au pas de 25. */
export function clampSpeed(value: unknown): number {
  return clampNumber(value, SPEED);
}

export function normalizeColor(value: unknown, fallback = DEFAULT_ORP_COLOR): string {
  if (typeof value !== 'string') return fallback;
  const v = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(v);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  return fallback;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function normalizeTiming(input: unknown, base: TimingCoefficients = TIMING_PRESETS.normal): TimingCoefficients {
  const src = isRecord(input) ? input : {};
  const out = {} as TimingCoefficients;
  for (const key of Object.keys(TIMING_BOUNDS) as (keyof TimingCoefficients)[]) {
    const b = TIMING_BOUNDS[key];
    out[key] = clampNumber(key in src ? src[key] : base[key], { ...b, default: base[key] });
  }
  return out;
}

export function normalizeAcceleration(input: unknown, base: AccelerationSettings = DEFAULT_ACCELERATION): AccelerationSettings {
  const src = isRecord(input) ? input : {};
  const startSpeed = clampNumber(src.startSpeed ?? base.startSpeed, { ...SPEED, default: base.startSpeed });
  const targetSpeed = Math.max(startSpeed, clampNumber(src.targetSpeed ?? base.targetSpeed, { ...SPEED, default: base.targetSpeed }));
  return {
    enabled: typeof src.enabled === 'boolean' ? src.enabled : base.enabled,
    startSpeed,
    targetSpeed,
    duration: clampNumber(src.duration ?? base.duration, { ...ACCELERATION_DURATION, default: base.duration }),
    curve: oneOf(src.curve, ['linear', 'ease-in-out'] as const, base.curve),
  };
}

export function normalizeAppearance(input: unknown, base: AppearanceSettings = DEFAULT_APPEARANCE): AppearanceSettings {
  const src = isRecord(input) ? input : {};
  return {
    orpColor: normalizeColor(src.orpColor, base.orpColor),
    fontSize: clampNumber(src.fontSize ?? base.fontSize, { ...FONT_SIZE, default: base.fontSize }),
    fontFamily: oneOf(src.fontFamily, FONT_IDS, base.fontFamily),
    showGuides: typeof src.showGuides === 'boolean' ? src.showGuides : base.showGuides,
    theme: oneOf(src.theme, THEME_IDS, base.theme),
  };
}

/** Niveau correspondant exactement à des coefficients, sinon `custom`. */
export function detectTimingLevel(timing: TimingCoefficients): TimingLevel | 'custom' {
  for (const level of TIMING_LEVELS) {
    const preset = TIMING_PRESETS[level];
    if ((Object.keys(preset) as (keyof TimingCoefficients)[]).every((k) => preset[k] === timing[k])) return level;
  }
  return 'custom';
}

/** Réglages complets d'un profil prédéfini. */
export function profileSettings(id: PresetProfileId, appearance: AppearanceSettings = DEFAULT_APPEARANCE, acceleration: AccelerationSettings = DEFAULT_ACCELERATION): ReaderSettings {
  const p = PROFILES[id];
  return {
    profile: id,
    speed: p.speed,
    timingLevel: p.timingLevel,
    timing: { ...TIMING_PRESETS[p.timingLevel] },
    acceleration: { ...acceleration, enabled: false },
    appearance: { ...appearance },
  };
}

export function createDefaultSettings(): ReaderSettings {
  return profileSettings('standard');
}

/** Vrai si les réglages de lecture correspondent exactement au profil prédéfini. */
export function matchesProfile(s: ReaderSettings, id: PresetProfileId): boolean {
  const p = PROFILES[id];
  return s.timingLevel === p.timingLevel && !s.acceleration.enabled;
}

/**
 * Valide un objet de réglages quelconque (options, préférences stockées).
 * Les champs invalides prennent leur valeur par défaut. Un profil prédéfini
 * dont les réglages ne correspondent plus devient `custom`.
 */
export function normalizeSettings(input: unknown): ReaderSettings {
  const src = isRecord(input) ? input : {};
  const profile = oneOf(src.profile, PROFILE_IDS, 'standard');
  const base = profile === 'custom' ? createDefaultSettings() : profileSettings(profile);
  const levelInput = oneOf(src.timingLevel, [...TIMING_LEVELS, 'custom'] as const, base.timingLevel);
  const timingBase = levelInput === 'custom' ? base.timing : TIMING_PRESETS[levelInput];
  const timing = normalizeTiming(src.timing, timingBase);
  const settings: ReaderSettings = {
    profile,
    speed: clampNumber(src.speed ?? base.speed, { ...SPEED, default: base.speed }),
    timingLevel: detectTimingLevel(timing),
    timing,
    acceleration: normalizeAcceleration(src.acceleration),
    appearance: normalizeAppearance(src.appearance),
  };
  if (settings.profile !== 'custom' && !matchesProfile(settings, settings.profile)) settings.profile = 'custom';
  return settings;
}

function sameJSON(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

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
export function applySettingsPatch(current: ReaderSettings, patch: SettingsPatch): PatchResult {
  let next: ReaderSettings = structuredCloneSettings(current);
  const p = isRecord(patch) ? patch : {};

  if (p.profile !== undefined) {
    const profile = oneOf(p.profile, PROFILE_IDS, current.profile);
    if (profile === 'custom') next.profile = 'custom';
    else next = profileSettings(profile, next.appearance, next.acceleration);
  }

  let readingChanged = false;
  if (p.timingLevel !== undefined) {
    const level = oneOf(p.timingLevel, TIMING_LEVELS, 'normal');
    const timing = { ...TIMING_PRESETS[level] };
    if (!sameJSON(timing, next.timing)) readingChanged = true;
    next.timing = timing;
  }
  if (p.timing !== undefined) {
    const timing = normalizeTiming({ ...next.timing, ...p.timing }, next.timing);
    if (!sameJSON(timing, next.timing)) readingChanged = true;
    next.timing = timing;
  }
  next.timingLevel = detectTimingLevel(next.timing);
  if (p.acceleration !== undefined) {
    const acceleration = normalizeAcceleration({ ...next.acceleration, ...p.acceleration }, next.acceleration);
    if (!sameJSON(acceleration, next.acceleration)) readingChanged = true;
    next.acceleration = acceleration;
  }
  if (readingChanged && next.profile !== 'custom') next.profile = 'custom';

  if (p.speed !== undefined) next.speed = clampSpeed(p.speed);
  if (p.appearance !== undefined) next.appearance = normalizeAppearance({ ...next.appearance, ...p.appearance }, next.appearance);

  const changed: SettingsSection[] = [];
  if (next.profile !== current.profile) changed.push('profile');
  if (next.speed !== current.speed) changed.push('speed');
  if (!sameJSON(next.timing, current.timing)) changed.push('timing');
  if (!sameJSON(next.acceleration, current.acceleration)) changed.push('acceleration');
  if (!sameJSON(next.appearance, current.appearance)) changed.push('appearance');
  return { settings: next, changed };
}

export function structuredCloneSettings(s: ReaderSettings): ReaderSettings {
  return {
    profile: s.profile,
    speed: s.speed,
    timingLevel: s.timingLevel,
    timing: { ...s.timing },
    acceleration: { ...s.acceleration },
    appearance: { ...s.appearance },
  };
}
