/** Libellés de l'interface. Français par défaut, anglais intégré, surcharge possible. */
export interface Labels {
  dialogTitle: string;
  close: string;
  play: string;
  playbackControls: string;
  pause: string;
  previousWord: string;
  nextWord: string;
  previousSentence: string;
  nextSentence: string;
  slower: string;
  faster: string;
  speedUnit: string;
  speedLabel: string;
  accelerating: string;
  progressLabel: string;
  wordPosition: (index: number, total: number) => string;
  remaining: (minutes: number) => string;
  rsvpRegion: string;
  rsvpDescription: string;
  fullText: string;
  resumeFollow: string;
  settings: string;
  closeSettings: string;
  statusPlaying: string;
  statusPaused: (index: number, total: number) => string;
  statusComplete: string;
  profile: string;
  profiles: Record<'comfort' | 'standard' | 'fast' | 'custom', string>;
  pauses: string;
  timingLevels: Record<'light' | 'normal' | 'strong' | 'custom', string>;
  detailedTiming: string;
  timingFields: Record<'comma' | 'clause' | 'sentence' | 'paragraph' | 'longWordThreshold' | 'longWordStep' | 'longWordMaxExtra', string>;
  acceleration: string;
  accelerationEnabled: string;
  accelerationStart: string;
  accelerationTarget: string;
  accelerationDuration: string;
  accelerationCurve: string;
  curves: Record<'linear' | 'ease-in-out', string>;
  appearance: string;
  orpColor: string;
  orpColorCustom: string;
  contrastAdjusted: string;
  fontSize: string;
  fontFamily: string;
  fonts: Record<'sans' | 'serif' | 'mono' | 'readable', string>;
  showGuides: string;
  theme: string;
  themes: Record<'auto' | 'light' | 'dark', string>;
  reset: string;
  shortcuts: string;
  shortcutList: [string, string][];
  colors: Record<string, string>;
}

export const LABELS_FR: Labels = {
  dialogTitle: 'Lecture rapide',
  close: 'Fermer le lecteur',
  play: 'Lecture',
  playbackControls: 'Commandes de lecture',
  pause: 'Pause',
  previousWord: 'Mot précédent',
  nextWord: 'Mot suivant',
  previousSentence: 'Phrase précédente',
  nextSentence: 'Phrase suivante',
  slower: 'Ralentir de 25 mots par minute',
  faster: 'Accélérer de 25 mots par minute',
  speedUnit: 'mots/min',
  speedLabel: 'Vitesse',
  accelerating: 'accélération',
  progressLabel: 'Position de lecture',
  wordPosition: (i, n) => `Mot ${i} sur ${n}`,
  remaining: (m) => (m < 1 ? 'moins d’1 min' : `≈ ${m} min`),
  rsvpRegion: 'Affichage mot par mot',
  rsvpDescription: 'Les mots défilent un par un. Le texte intégral reste consultable dans la zone « Texte intégral ».',
  fullText: 'Texte intégral',
  resumeFollow: 'Reprendre le suivi',
  settings: 'Réglages',
  closeSettings: 'Fermer les réglages',
  statusPlaying: 'Lecture en cours',
  statusPaused: (i, n) => `En pause, mot ${i} sur ${n}`,
  statusComplete: 'Lecture terminée',
  profile: 'Profil',
  profiles: { comfort: 'Confort', standard: 'Standard', fast: 'Rapide', custom: 'Personnalisé' },
  pauses: 'Pauses adaptatives',
  timingLevels: { light: 'Faibles', normal: 'Normales', strong: 'Fortes', custom: 'Personnalisées' },
  detailedTiming: 'Réglages détaillés',
  timingFields: {
    comma: 'Virgule (×)',
    clause: 'Point-virgule, deux-points (×)',
    sentence: 'Fin de phrase (×)',
    paragraph: 'Fin de paragraphe (×)',
    longWordThreshold: 'Mot long à partir de (lettres)',
    longWordStep: 'Supplément par lettre (%)',
    longWordMaxExtra: 'Supplément maximal (%)',
  },
  acceleration: 'Accélération progressive',
  accelerationEnabled: 'Activer l’accélération',
  accelerationStart: 'Vitesse de départ (mots/min)',
  accelerationTarget: 'Vitesse cible (mots/min)',
  accelerationDuration: 'Durée de montée (s)',
  accelerationCurve: 'Progression',
  curves: { linear: 'Linéaire', 'ease-in-out': 'Douce' },
  appearance: 'Apparence',
  orpColor: 'Couleur de la lettre de fixation',
  orpColorCustom: 'Couleur personnalisée',
  contrastAdjusted: 'Couleur ajustée automatiquement pour rester lisible sur ce fond.',
  fontSize: 'Taille du texte',
  fontFamily: 'Police',
  fonts: { sans: 'Sans empattement', serif: 'Avec empattement', mono: 'Chasse fixe', readable: 'Haute lisibilité' },
  showGuides: 'Afficher les repères de fixation',
  theme: 'Thème',
  themes: { auto: 'Système', light: 'Clair', dark: 'Sombre' },
  reset: 'Rétablir les réglages par défaut',
  shortcuts: 'Raccourcis clavier',
  shortcutList: [
    ['Espace', 'Lecture / pause'],
    ['← / →', 'Mot précédent / suivant'],
    ['Maj + ← / →', 'Phrase précédente / suivante'],
    ['↑ / ↓', 'Vitesse ± 25'],
    ['Début / Fin', 'Premier / dernier mot'],
    ['Échap', 'Fermer'],
  ],
  colors: { '#d32f2f': 'Rouge', '#e65100': 'Orange', '#2e7d32': 'Vert', '#1565c0': 'Bleu', '#6a1b9a': 'Violet' },
};

export const LABELS_EN: Labels = {
  ...LABELS_FR,
  dialogTitle: 'Speed reading',
  close: 'Close reader',
  play: 'Play',
  playbackControls: 'Playback controls',
  pause: 'Pause',
  previousWord: 'Previous word',
  nextWord: 'Next word',
  previousSentence: 'Previous sentence',
  nextSentence: 'Next sentence',
  slower: 'Slow down by 25 words per minute',
  faster: 'Speed up by 25 words per minute',
  speedUnit: 'wpm',
  speedLabel: 'Speed',
  accelerating: 'ramping up',
  progressLabel: 'Reading position',
  wordPosition: (i, n) => `Word ${i} of ${n}`,
  remaining: (m) => (m < 1 ? 'under 1 min' : `≈ ${m} min`),
  rsvpRegion: 'Word-by-word display',
  rsvpDescription: 'Words are shown one at a time. The full text remains available in the “Full text” area.',
  fullText: 'Full text',
  resumeFollow: 'Resume following',
  settings: 'Settings',
  closeSettings: 'Close settings',
  statusPlaying: 'Playing',
  statusPaused: (i, n) => `Paused, word ${i} of ${n}`,
  statusComplete: 'Finished',
  profile: 'Profile',
  profiles: { comfort: 'Comfort', standard: 'Standard', fast: 'Fast', custom: 'Custom' },
  pauses: 'Adaptive pauses',
  timingLevels: { light: 'Light', normal: 'Normal', strong: 'Strong', custom: 'Custom' },
  detailedTiming: 'Detailed settings',
  timingFields: {
    comma: 'Comma (×)',
    clause: 'Semicolon, colon (×)',
    sentence: 'End of sentence (×)',
    paragraph: 'End of paragraph (×)',
    longWordThreshold: 'Long word from (letters)',
    longWordStep: 'Extra per letter (%)',
    longWordMaxExtra: 'Maximum extra (%)',
  },
  acceleration: 'Progressive acceleration',
  accelerationEnabled: 'Enable acceleration',
  accelerationStart: 'Start speed (wpm)',
  accelerationTarget: 'Target speed (wpm)',
  accelerationDuration: 'Ramp duration (s)',
  accelerationCurve: 'Curve',
  curves: { linear: 'Linear', 'ease-in-out': 'Smooth' },
  appearance: 'Appearance',
  orpColor: 'Fixation letter colour',
  orpColorCustom: 'Custom colour',
  contrastAdjusted: 'Colour automatically adjusted to stay readable on this background.',
  fontSize: 'Text size',
  fontFamily: 'Font',
  fonts: { sans: 'Sans serif', serif: 'Serif', mono: 'Monospace', readable: 'High legibility' },
  showGuides: 'Show fixation guides',
  theme: 'Theme',
  themes: { auto: 'System', light: 'Light', dark: 'Dark' },
  reset: 'Restore default settings',
  shortcuts: 'Keyboard shortcuts',
  shortcutList: [
    ['Space', 'Play / pause'],
    ['← / →', 'Previous / next word'],
    ['Shift + ← / →', 'Previous / next sentence'],
    ['↑ / ↓', 'Speed ± 25'],
    ['Home / End', 'First / last word'],
    ['Esc', 'Close'],
  ],
  colors: { '#d32f2f': 'Red', '#e65100': 'Orange', '#2e7d32': 'Green', '#1565c0': 'Blue', '#6a1b9a': 'Purple' },
};

export type LabelLocale = 'fr' | 'en';

export function resolveLabels(locale: LabelLocale = 'fr', overrides: Partial<Labels> = {}): Labels {
  return { ...(locale === 'en' ? LABELS_EN : LABELS_FR), ...overrides };
}
