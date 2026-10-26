/**
 * Styles du lecteur, confinés au Shadow DOM : rien n'est injecté dans la page
 * hôte. `:host { all: initial }` isole aussi le lecteur des styles hérités.
 */
export declare const FONT_STACKS: {
    readonly sans: "system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", \"DejaVu Sans\", sans-serif";
    readonly serif: "Georgia, Cambria, \"Times New Roman\", Times, \"DejaVu Serif\", serif";
    readonly mono: "ui-monospace, \"SF Mono\", Menlo, Consolas, \"Liberation Mono\", \"DejaVu Sans Mono\", monospace";
    readonly readable: "Verdana, \"Atkinson Hyperlegible\", Tahoma, \"DejaVu Sans\", sans-serif";
};
/** Fonds de la zone RSVP par thème, utilisés pour garantir le contraste ORP. */
export declare const STAGE_BACKGROUNDS: {
    readonly light: "#ffffff";
    readonly dark: "#161616";
};
export declare const STYLES: string;
