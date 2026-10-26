import type { RsvpEngine } from '../core/engine';
import type { NormalizedDocument } from '../core/model';
import { type ReaderSettings, type SettingsPatch } from '../core/settings';
import type { Labels } from './labels';
/**
 * Interface entre le Web Component et le contrôleur du lecteur (api). Le
 * composant n'instancie aucun moteur : il reçoit l'unique instance du
 * contrôleur et lui délègue toutes les actions.
 */
export interface ReaderViewHost {
    readonly engine: RsvpEngine;
    readonly labels: Labels;
    getSettings(): ReaderSettings;
    updateSettings(patch: SettingsPatch): void;
    resetSettings(): void;
    setSpeed(speed: number): void;
    activateWord(index: number): void;
    requestClose(): void;
    /** Le composant a été retiré du document alors qu'il était ouvert. */
    onDisconnected(): void;
}
/** Interface publique interne du composant `<urr-reader>`. */
export interface ReaderElement extends HTMLElement {
    readonly isOpen: boolean;
    attach(host: ReaderViewHost): void;
    open(doc: NormalizedDocument, title: string): void;
    close(): void;
    teardown(): void;
    applySettings(settings: ReaderSettings): void;
}
export declare const DEFAULT_TAG_NAME = "urr-reader";
/** Enregistre l'élément personnalisé (idempotent). */
export declare function defineReaderElement(tagName?: string): string;
