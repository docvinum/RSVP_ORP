/**
 * Création d'éléments sûre : le contenu est toujours inséré via
 * `textContent` / nœuds texte, jamais via `innerHTML`.
 */
type Attrs = Record<string, string | number | boolean | undefined>;
type Child = Node | string | null | undefined | false;
export declare function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Attrs, ...children: Child[]): HTMLElementTagNameMap[K];
/** Icônes (tracés SVG statiques, définis ici). */
declare const ICONS: {
    readonly play: "M8 5v14l11-7z";
    readonly pause: "M6 5h4v14H6zM14 5h4v14h-4z";
    readonly prevWord: "M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z";
    readonly nextWord: "M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z";
    readonly prevSentence: "M6 6h2v12H6zm3.5 6 8.5 6V6z";
    readonly nextSentence: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z";
    readonly close: "M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z";
    readonly settings: "M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z";
    readonly minus: "M5 11h14v2H5z";
    readonly plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z";
    readonly follow: "M12 8l-6 6 1.4 1.4L12 10.8l4.6 4.6L18 14z";
};
export type IconName = keyof typeof ICONS;
export declare function icon(name: IconName): SVGSVGElement;
export declare function setIcon(button: HTMLElement, name: IconName): void;
export {};
