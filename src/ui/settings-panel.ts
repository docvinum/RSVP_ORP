import {
  ACCELERATION_DURATION,
  FONT_IDS,
  FONT_SIZE,
  PROFILE_IDS,
  SPEED,
  THEME_IDS,
  TIMING_BOUNDS,
  TIMING_LEVELS,
  type ReaderSettings,
  type SettingsPatch,
  type TimingCoefficients,
} from '../core/settings';
import { h, icon } from './dom';
import type { Labels } from './labels';

export interface SettingsPanelCallbacks {
  onChange(patch: SettingsPatch): void;
  onReset(): void;
  onClose(): void;
}

export const ORP_PRESET_COLORS = ['#d32f2f', '#e65100', '#2e7d32', '#1565c0', '#6a1b9a'] as const;

/** Les champs en pourcentage sont stockés en fraction (0,05 ↔ 5 %). */
const PERCENT_FIELDS = new Set<keyof TimingCoefficients>(['longWordStep', 'longWordMaxExtra']);

let uid = 0;

/**
 * Panneau de réglages avancés. Il ne contient aucune logique de lecture : il
 * émet des modifications (`SettingsPatch`) validées et appliquées par le
 * contrôleur unique du lecteur, puis reflète les réglages résultants.
 */
export class SettingsPanel {
  readonly element: HTMLElement;
  readonly closeButton: HTMLButtonElement;
  private readonly id = `urr-settings-${++uid}`;
  private readonly inputs = new Map<string, HTMLInputElement | HTMLSelectElement>();
  private readonly contrastHint: HTMLElement;
  private readonly fontSizeOutput: HTMLOutputElement;

  constructor(
    private readonly labels: Labels,
    private readonly callbacks: SettingsPanelCallbacks,
    signal: AbortSignal,
  ) {
    const L = labels;
    const titleId = `${this.id}-title`;
    this.closeButton = h('button', { type: 'button', class: 'icon', 'aria-label': L.closeSettings, title: L.closeSettings }, icon('close'));
    this.closeButton.addEventListener('click', () => callbacks.onClose(), { signal });

    this.contrastHint = h('p', { class: 'hint', hidden: true, id: `${this.id}-contrast` }, L.contrastAdjusted);
    this.fontSizeOutput = h('output', {});

    const form = h('form', { novalidate: true },
      this.radioGroup('profile', L.profile, PROFILE_IDS.map((p) => [p, L.profiles[p]])),
      this.radioGroup('timingLevel', L.pauses, [...TIMING_LEVELS.map((t) => [t, L.timingLevels[t]] as [string, string])]),
      h('p', { class: 'hint', 'data-hint': 'timing-custom', hidden: true }, `${L.pauses} : ${L.timingLevels.custom}`),
      h('details', {},
        h('summary', {}, L.detailedTiming),
        ...(Object.keys(TIMING_BOUNDS) as (keyof TimingCoefficients)[]).map((key) => {
          const b = TIMING_BOUNDS[key];
          const pct = PERCENT_FIELDS.has(key);
          return this.numberField(`timing.${key}`, L.timingFields[key], pct ? b.min * 100 : b.min, pct ? b.max * 100 : b.max, pct ? (b.step ?? 0.01) * 100 : (b.step ?? 1));
        }),
      ),
      h('fieldset', {},
        h('legend', {}, L.acceleration),
        this.checkbox('acceleration.enabled', L.accelerationEnabled),
        this.numberField('acceleration.startSpeed', L.accelerationStart, SPEED.min, SPEED.max, SPEED.step),
        this.numberField('acceleration.targetSpeed', L.accelerationTarget, SPEED.min, SPEED.max, SPEED.step),
        this.numberField('acceleration.duration', L.accelerationDuration, ACCELERATION_DURATION.min, ACCELERATION_DURATION.max, ACCELERATION_DURATION.step ?? 5),
        this.select('acceleration.curve', L.accelerationCurve, [['linear', L.curves.linear], ['ease-in-out', L.curves['ease-in-out']]]),
      ),
      h('fieldset', {},
        h('legend', {}, L.appearance),
        this.colorGroup(),
        this.contrastHint,
        this.rangeField('appearance.fontSize', L.fontSize, FONT_SIZE.min, FONT_SIZE.max, FONT_SIZE.step ?? 2),
        this.select('appearance.fontFamily', L.fontFamily, FONT_IDS.map((f) => [f, L.fonts[f]])),
        this.checkbox('appearance.showGuides', L.showGuides),
        this.select('appearance.theme', L.theme, THEME_IDS.map((t) => [t, L.themes[t]])),
      ),
      h('button', { type: 'button', class: 'reset', 'data-action': 'reset' }, L.reset),
      h('details', { class: 'shortcuts' },
        h('summary', {}, L.shortcuts),
        h('dl', {}, ...L.shortcutList.flatMap(([k, v]) => [h('dt', {}, h('kbd', {}, k)), h('dd', {}, v)])),
      ),
    );
    form.addEventListener('submit', (e) => e.preventDefault(), { signal });
    form.addEventListener('change', (e) => this.handleChange(e.target as HTMLInputElement | HTMLSelectElement), { signal });
    form.addEventListener('input', (e) => {
      const t = e.target as HTMLInputElement;
      // Retour immédiat pour la taille de police et la couleur (curseur, sélecteur de couleur).
      if (t.name === 'appearance.fontSize' || t.name === 'appearance.orpColorCustom') this.handleChange(t);
    }, { signal });
    form.querySelector('[data-action="reset"]')!.addEventListener('click', () => callbacks.onReset(), { signal });

    this.element = h('section', { class: 'panel', id: this.id, role: 'region', 'aria-labelledby': titleId, hidden: true, part: 'settings' },
      h('div', { class: 'panel-head' }, h('h3', { id: titleId }, L.settings), this.closeButton),
      form,
    );
  }

  get panelId(): string {
    return this.id;
  }

  private fieldId(name: string): string {
    return `${this.id}-${name.replace(/\W/g, '-')}`;
  }

  private register<T extends HTMLInputElement | HTMLSelectElement>(name: string, el: T): T {
    this.inputs.set(name, el);
    return el;
  }

  private radioGroup(name: string, legend: string, options: [string, string][]): HTMLElement {
    return h('fieldset', {},
      h('legend', {}, legend),
      h('div', { class: 'choices' },
        ...options.map(([value, label]) => {
          const input = h('input', { type: 'radio', name, value });
          this.register(`${name}=${value}`, input);
          return h('label', { class: 'choice' }, input, h('span', {}, label));
        }),
      ),
    );
  }

  private colorGroup(): HTMLElement {
    const L = this.labels;
    const custom = this.register('appearance.orpColorCustom', h('input', { type: 'color', name: 'appearance.orpColorCustom', id: this.fieldId('orp-custom') }));
    return h('fieldset', {},
      h('legend', {}, L.orpColor),
      h('div', { class: 'choices' },
        ...ORP_PRESET_COLORS.map((color) => {
          const input = h('input', { type: 'radio', name: 'appearance.orpColor', value: color, 'aria-label': L.colors[color] ?? color });
          this.register(`appearance.orpColor=${color}`, input);
          const swatch = h('i', {});
          swatch.style.background = color;
          return h('label', { class: 'choice swatch', title: L.colors[color] ?? color }, input, h('span', {}, swatch));
        }),
      ),
      h('div', { class: 'field' }, h('label', { for: custom.id }, L.orpColorCustom), custom),
    );
  }

  private numberField(name: string, label: string, min: number, max: number, step: number): HTMLElement {
    const id = this.fieldId(name);
    const input = this.register(name, h('input', { type: 'number', name, id, min, max, step, inputmode: 'decimal' }));
    return h('div', { class: 'field' }, h('label', { for: id }, label), input);
  }

  private rangeField(name: string, label: string, min: number, max: number, step: number): HTMLElement {
    const id = this.fieldId(name);
    const input = this.register(name, h('input', { type: 'range', name, id, min, max, step }));
    this.fontSizeOutput.htmlFor.add(id);
    return h('div', { class: 'field' }, h('label', { for: id }, label), input, this.fontSizeOutput);
  }

  private checkbox(name: string, label: string): HTMLElement {
    const input = this.register(name, h('input', { type: 'checkbox', name }));
    return h('label', { class: 'check' }, input, label);
  }

  private select(name: string, label: string, options: [string, string][]): HTMLElement {
    const id = this.fieldId(name);
    const select = this.register(name, h('select', { name, id }, ...options.map(([v, l]) => h('option', { value: v }, l))));
    return h('div', { class: 'field' }, h('label', { for: id }, label), select);
  }

  private handleChange(target: HTMLInputElement | HTMLSelectElement): void {
    const name = target.name;
    if (!name) return;
    const value = target.value;
    const num = Number(value);
    const [section, key] = name.split('.') as [string, string | undefined];
    if (target instanceof HTMLInputElement && target.type === 'number' && (value === '' || !Number.isFinite(num))) return;
    let patch: SettingsPatch | null = null;
    if (name === 'profile') patch = { profile: value as SettingsPatch['profile'] };
    else if (name === 'timingLevel') patch = { timingLevel: value as SettingsPatch['timingLevel'] };
    else if (section === 'timing' && key) {
      const k = key as keyof TimingCoefficients;
      patch = { timing: { [k]: PERCENT_FIELDS.has(k) ? num / 100 : num } };
    } else if (section === 'acceleration' && key) {
      const v = key === 'enabled' ? (target as HTMLInputElement).checked : key === 'curve' ? value : num;
      patch = { acceleration: { [key]: v } };
    } else if (section === 'appearance' && key) {
      if (key === 'orpColorCustom') patch = { appearance: { orpColor: value } };
      else if (key === 'showGuides') patch = { appearance: { showGuides: (target as HTMLInputElement).checked } };
      else if (key === 'fontSize') patch = { appearance: { fontSize: num } };
      else patch = { appearance: { [key]: value } };
    }
    if (patch) this.callbacks.onChange(patch);
  }

  /** Reflète les réglages courants dans le formulaire. */
  update(settings: ReaderSettings, contrastAdjusted: boolean): void {
    const setChecked = (name: string, checked: boolean) => {
      const el = this.inputs.get(name);
      if (el instanceof HTMLInputElement) el.checked = checked;
    };
    const active = (this.element.getRootNode() as Document | ShadowRoot).activeElement;
    const setValue = (name: string, value: string | number) => {
      const el = this.inputs.get(name);
      // Ne pas réécrire un champ numérique en cours de saisie.
      if (el && (el !== active || el.type !== 'number')) el.value = String(value);
    };
    for (const p of PROFILE_IDS) setChecked(`profile=${p}`, settings.profile === p);
    for (const t of TIMING_LEVELS) setChecked(`timingLevel=${t}`, settings.timingLevel === t);
    const customHint = this.element.querySelector<HTMLElement>('[data-hint="timing-custom"]');
    if (customHint) customHint.hidden = settings.timingLevel !== 'custom';
    for (const key of Object.keys(settings.timing) as (keyof TimingCoefficients)[]) {
      const v = settings.timing[key];
      setValue(`timing.${key}`, PERCENT_FIELDS.has(key) ? Number((v * 100).toFixed(2)) : v);
    }
    setChecked('acceleration.enabled', settings.acceleration.enabled);
    setValue('acceleration.startSpeed', settings.acceleration.startSpeed);
    setValue('acceleration.targetSpeed', settings.acceleration.targetSpeed);
    setValue('acceleration.duration', settings.acceleration.duration);
    setValue('acceleration.curve', settings.acceleration.curve);
    for (const c of ORP_PRESET_COLORS) setChecked(`appearance.orpColor=${c}`, settings.appearance.orpColor === c);
    setValue('appearance.orpColorCustom', settings.appearance.orpColor);
    setValue('appearance.fontSize', settings.appearance.fontSize);
    this.fontSizeOutput.value = `${settings.appearance.fontSize} px`;
    setValue('appearance.fontFamily', settings.appearance.fontFamily);
    setChecked('appearance.showGuides', settings.appearance.showGuides);
    setValue('appearance.theme', settings.appearance.theme);
    this.contrastHint.hidden = !contrastAdjusted;
  }

  /** Premier élément focalisable du panneau. */
  firstFocusable(): HTMLElement {
    return (this.element.querySelector('input:checked') as HTMLElement | null) ?? this.closeButton;
  }
}
