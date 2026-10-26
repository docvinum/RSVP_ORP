import { type ReaderSettings, type SettingsPatch } from '../core/settings';
import type { Labels } from './labels';
export interface SettingsPanelCallbacks {
    onChange(patch: SettingsPatch): void;
    onReset(): void;
    onClose(): void;
}
export declare const ORP_PRESET_COLORS: readonly ["#d32f2f", "#e65100", "#2e7d32", "#1565c0", "#6a1b9a"];
/**
 * Panneau de réglages avancés. Il ne contient aucune logique de lecture : il
 * émet des modifications (`SettingsPatch`) validées et appliquées par le
 * contrôleur unique du lecteur, puis reflète les réglages résultants.
 */
export declare class SettingsPanel {
    private readonly labels;
    private readonly callbacks;
    readonly element: HTMLElement;
    readonly closeButton: HTMLButtonElement;
    private readonly id;
    private readonly inputs;
    private readonly contrastHint;
    private readonly fontSizeOutput;
    constructor(labels: Labels, callbacks: SettingsPanelCallbacks, signal: AbortSignal);
    get panelId(): string;
    private fieldId;
    private register;
    private radioGroup;
    private colorGroup;
    private numberField;
    private rangeField;
    private checkbox;
    private select;
    private handleChange;
    /** Reflète les réglages courants dans le formulaire. */
    update(settings: ReaderSettings, contrastAdjusted: boolean): void;
    /** Premier élément focalisable du panneau. */
    firstFocusable(): HTMLElement;
}
