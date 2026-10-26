/**
 * Styles du lecteur, confinés au Shadow DOM : rien n'est injecté dans la page
 * hôte. `:host { all: initial }` isole aussi le lecteur des styles hérités.
 */
export const FONT_STACKS = {
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "DejaVu Sans", sans-serif',
  serif: 'Georgia, Cambria, "Times New Roman", Times, "DejaVu Serif", serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", "DejaVu Sans Mono", monospace',
  readable: 'Verdana, "Atkinson Hyperlegible", Tahoma, "DejaVu Sans", sans-serif',
} as const;

/** Fonds de la zone RSVP par thème, utilisés pour garantir le contraste ORP. */
export const STAGE_BACKGROUNDS = { light: '#ffffff', dark: '#161616' } as const;

export const STYLES = /* css */ `
:host {
  all: initial;
  display: contents;
}
*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }

.root {
  --bg: ${STAGE_BACKGROUNDS.light};
  --surface: #f4f4f2;
  --text: #1c1c1c;
  --muted: #595959;
  --border: #c9c9c9;
  --focus: #1a5fb4;
  --accent: #1a5fb4;
  --accent-text: #ffffff;
  --cur-bg: #ffe46b;
  --cur-text: #1c1c1c;
  --sentence-bg: #e8f0fb;
  --backdrop: rgb(0 0 0 / 0.55);
  --orp: #d32f2f;
  --rsvp-size: 48px;
  --rsvp-font: ${FONT_STACKS.sans};
  --ui-font: ${FONT_STACKS.sans};
  --axis: 38%;
  color-scheme: light;
}
.root[data-theme="dark"] {
  --bg: ${STAGE_BACKGROUNDS.dark};
  --surface: #232323;
  --text: #ededed;
  --muted: #b0b0b0;
  --border: #4a4a4a;
  --focus: #8ab4f8;
  --accent: #8ab4f8;
  --accent-text: #0b1a33;
  --cur-bg: #6b5600;
  --cur-text: #ffffff;
  --sentence-bg: #1d2a3a;
  --backdrop: rgb(0 0 0 / 0.7);
  color-scheme: dark;
}

dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 12px;
  width: min(980px, calc(100vw - 32px));
  height: min(780px, calc(100dvh - 32px));
  max-width: none;
  max-height: none;
  background: var(--bg);
  color: var(--text);
  font-family: var(--ui-font);
  font-size: 16px;
  line-height: 1.5;
  overflow: hidden;
  overscroll-behavior: contain;
  box-shadow: 0 20px 60px rgb(0 0 0 / 0.35);
}
dialog:not([open]) { display: none; }
dialog::backdrop { background: var(--backdrop); }

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  height: 100%;
}
.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 8px 20px;
  border-bottom: 1px solid var(--border);
}
header h2 {
  flex: 1;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

button, select, input { font: inherit; color: inherit; }
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 44px;
  min-height: 44px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}
button:hover { background: var(--surface); }
button svg { width: 24px; height: 24px; flex: none; }
:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.primary {
  background: var(--accent);
  color: var(--accent-text);
  min-width: 56px;
  min-height: 56px;
  border-radius: 50%;
}
.primary:hover { background: var(--accent); filter: brightness(1.08); }
.primary svg { width: 30px; height: 30px; }

/* ───── Zone RSVP ───── */
.stage {
  position: relative;
  flex: 0 0 auto;
  height: clamp(140px, 30vh, 240px);
  overflow: hidden;
  background: var(--bg);
  user-select: none;
}
.guide {
  position: absolute;
  left: var(--axis);
  width: 2px;
  height: 18%;
  margin-left: -1px;
  background: var(--muted);
  opacity: 0.6;
}
.guide.top { top: 12%; }
.guide.bottom { bottom: 12%; }
.guide-line {
  position: absolute;
  left: 8px;
  right: 8px;
  height: 1px;
  background: var(--border);
}
.guide-line.top { top: 30%; }
.guide-line.bottom { bottom: 30%; }
.root[data-guides="false"] .guide, .root[data-guides="false"] .guide-line { display: none; }
.word {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  white-space: pre;
  font-family: var(--rsvp-font);
  font-size: var(--rsvp-size);
  line-height: 1.2;
  color: var(--text);
}
.word .pivot { color: var(--orp); font-weight: 700; }
.stage-status {
  position: absolute;
  bottom: 6px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 0.875rem;
  color: var(--muted);
}

/* ───── Progression et commandes ───── */
.progress {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 20px;
  font-size: 0.875rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.progress input[type="range"] { flex: 1; min-width: 0; accent-color: var(--accent); height: 24px; }
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px 12px;
  padding: 4px 12px 10px;
  border-bottom: 1px solid var(--border);
}
.transport, .speed { display: flex; align-items: center; gap: 4px; }
.speed output {
  min-width: 9.5ch;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.speed .ramp { display: block; font-size: 0.75rem; color: var(--muted); }

/* ───── Texte intégral ───── */
.fulltext-wrap { position: relative; flex: 1 1 auto; min-height: 0; }
.fulltext {
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 12px 24px 40px;
  background: var(--surface);
  font-size: 1.0625rem;
  line-height: 1.7;
}
.fulltext h3, .fulltext h4, .fulltext h5, .fulltext h6 { margin: 1em 0 0.4em; line-height: 1.3; }
.fulltext p, .fulltext pre, .fulltext blockquote, .fulltext ul { margin: 0 0 0.8em; }
.fulltext blockquote { padding-left: 1em; border-left: 3px solid var(--border); }
.fulltext pre { white-space: pre-wrap; font-family: ${FONT_STACKS.mono}; font-size: 0.9375rem; }
.fulltext .w { cursor: pointer; border-radius: 3px; }
.fulltext .w:hover { text-decoration: underline; }
.fulltext .s.active { background: var(--sentence-bg); border-radius: 3px; }
.fulltext .w.cur { background: var(--cur-bg); color: var(--cur-text); outline: 1px solid var(--cur-text); outline-offset: 0; }
.resume-follow {
  position: absolute;
  right: 16px;
  bottom: 12px;
  background: var(--accent);
  color: var(--accent-text);
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.25);
}
.resume-follow:hover { background: var(--accent); filter: brightness(1.08); }
.resume-follow[hidden] { display: none; }

/* ───── Réglages ───── */
.panel {
  width: 360px;
  border-left: 1px solid var(--border);
  background: var(--bg);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.panel[hidden] { display: none; }
.panel-head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 8px 8px 8px 20px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}
.panel-head h3 { flex: 1; margin: 0; font-size: 1rem; }
.panel form { padding: 8px 20px 24px; }
fieldset { margin: 12px 0; padding: 0; border: 0; }
legend { padding: 0; margin-bottom: 6px; font-weight: 600; }
.choices { display: flex; flex-wrap: wrap; gap: 6px; }
.choice { position: relative; }
.choice input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.choice span {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 20px;
  cursor: pointer;
}
.choice input:checked + span { background: var(--accent); color: var(--accent-text); border-color: var(--accent); }
.choice input:focus-visible + span { outline: 3px solid var(--focus); outline-offset: 2px; }
.swatch span { width: 40px; padding: 0; justify-content: center; }
.swatch i { display: block; width: 22px; height: 22px; border-radius: 50%; }
.field { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 8px 0; }
.field label { flex: 1; }
.field input[type="number"] { width: 6.5em; min-height: 36px; padding: 0 6px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); }
.field select { min-height: 36px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); padding: 0 6px; }
.field input[type="range"] { flex: 1; accent-color: var(--accent); }
.field input[type="color"] { width: 44px; height: 36px; padding: 0; border: 1px solid var(--border); border-radius: 6px; background: none; }
.check { display: flex; align-items: center; gap: 10px; min-height: 40px; }
.check input { width: 20px; height: 20px; accent-color: var(--accent); }
details { margin: 8px 0; }
summary { cursor: pointer; padding: 8px 0; }
.hint { margin: 4px 0; font-size: 0.875rem; color: var(--muted); }
.hint[hidden] { display: none; }
.reset { width: 100%; margin-top: 12px; border-color: var(--border); }
.shortcuts { font-size: 0.875rem; }
.shortcuts dl { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; margin: 0; }
.shortcuts dt { font-weight: 600; }
.shortcuts dd { margin: 0; color: var(--muted); }
kbd { font-family: inherit; }

.sr-only {
  position: absolute !important;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0);
  white-space: nowrap; border: 0;
}

/* ───── Mobile : plein écran, disposition verticale ───── */
@media (max-width: 640px), (max-height: 480px) and (pointer: coarse) {
  dialog {
    width: 100vw;
    height: 100dvh;
    border: 0;
    border-radius: 0;
  }
  .layout { grid-template-columns: minmax(0, 1fr); position: relative; }
  header { padding-left: 12px; }
  .stage { height: clamp(120px, 26dvh, 200px); }
  .progress { padding: 4px 12px; }
  .controls { gap: 2px 8px; padding: 2px 4px 8px; }
  .fulltext { padding: 10px 16px 64px; }
  .panel {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    top: calc(clamp(120px, 26dvh, 200px) + 61px);
    width: auto;
    border-left: 0;
    border-top: 1px solid var(--border);
    border-radius: 12px 12px 0 0;
    box-shadow: 0 -10px 30px rgb(0 0 0 / 0.3);
    z-index: 2;
  }
}

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}
@media (forced-colors: active) {
  .word .pivot { color: Highlight; }
  .fulltext .w.cur { outline: 2px solid Highlight; }
}
`;
