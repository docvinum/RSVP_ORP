import type { NormalizedDocument } from '../core/model';
/**
 * Vue du texte intégral, reconstruite à partir du modèle normalisé (jamais du
 * HTML source). Chaque mot porte son index stable (`data-w`), chaque phrase
 * le sien (`data-s`) : la synchronisation est en O(1).
 *
 * Suivi automatique : le défilement n'a lieu que lorsque le mot courant sort
 * d'une bande de confort (15 %–70 % de la hauteur visible). Toute action de
 * défilement de l'utilisateur (molette, toucher, clavier, barre de
 * défilement) suspend le suivi jusqu'à sa réactivation explicite.
 */
export interface FullTextCallbacks {
    onWordActivate(index: number): void;
    onFollowChange(following: boolean): void;
}
export declare class FullTextView {
    private readonly callbacks;
    readonly element: HTMLElement;
    private words;
    private sentences;
    private currentWord;
    private currentSentence;
    private following;
    private reducedMotion;
    constructor(callbacks: FullTextCallbacks, signal: AbortSignal, label: string);
    setReducedMotion(reduced: boolean): void;
    get isFollowing(): boolean;
    setFollowing(following: boolean): void;
    render(doc: NormalizedDocument): void;
    private wrapBlock;
    private renderBlock;
    /** Met en évidence le mot et la phrase courants. */
    highlight(wordIndex: number, sentenceIndex: number): void;
    /** Défile uniquement si le mot courant sort de la bande de confort. */
    scrollToCurrent(force: boolean): void;
}
