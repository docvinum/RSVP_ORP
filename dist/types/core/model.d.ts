/**
 * Représentation intermédiaire commune à toutes les sources (texte, HTML,
 * Markdown, DOM). Elle est produite par `buildDocument()` et consommée par le
 * moteur RSVP et par la vue du texte intégral.
 *
 * Toutes les positions (`start`/`end`) sont des offsets en unités UTF-16 dans
 * `NormalizedDocument.text`, `end` exclusif. Tous les index sont stables : ils
 * ne dépendent que du contenu normalisé, jamais de l'état de lecture.
 */
/** Nature d'un bloc, utilisée pour la reconstruction du texte intégral. */
export type BlockKind = 'paragraph' | 'heading' | 'list-item' | 'quote' | 'code' | 'table-row';
/** Bloc brut produit par un parseur, avant normalisation. */
export interface RawBlock {
    kind: BlockKind;
    /** Niveau de titre (1–6) pour `heading`. */
    level?: number;
    /** Texte brut ; les espaces seront normalisés. */
    text: string;
}
export interface Block {
    index: number;
    kind: BlockKind;
    level?: number;
    start: number;
    end: number;
    /** Première phrase du bloc (incluse). */
    sentenceStart: number;
    /** Dernière phrase du bloc (exclue). */
    sentenceEnd: number;
    /** Premier mot du bloc (inclus). */
    wordStart: number;
    /** Dernier mot du bloc (exclu). */
    wordEnd: number;
}
export interface Sentence {
    index: number;
    blockIndex: number;
    start: number;
    end: number;
    wordStart: number;
    wordEnd: number;
}
/**
 * Nature d'un token élémentaire :
 * - `word` : segment lexical contenant au moins une lettre ;
 * - `number` : segment lexical uniquement numérique ;
 * - `punct` : ponctuation ;
 * - `symbol` : autre caractère non lexical (emoji, symbole…) ;
 * - `space` : espace (y compris insécables).
 */
export type TokenKind = 'word' | 'number' | 'punct' | 'symbol' | 'space';
export interface Token {
    index: number;
    kind: TokenKind;
    text: string;
    start: number;
    end: number;
    blockIndex: number;
    /** Mot de lecture auquel le token est rattaché (absent pour les espaces). */
    wordIndex?: number;
}
/** Ponctuation finale la plus forte portée par un mot de lecture. */
export type PausePunctuation = 'none' | 'comma' | 'clause' | 'sentence';
/**
 * Unité de lecture RSVP (« mot ») : un mot accompagné de sa ponctuation
 * attenante (« Bonjour, », « l'homme », « 1 000 », « (voir »).
 */
export interface Word {
    index: number;
    /** Texte affiché, égal à `document.text.slice(start, end)`. */
    text: string;
    start: number;
    end: number;
    blockIndex: number;
    sentenceIndex: number;
    /** Premier token (inclus). */
    tokenStart: number;
    /** Dernier token (exclu). */
    tokenEnd: number;
    /** Nombre de graphèmes de lettres/chiffres (utilisé pour les mots longs). */
    letterCount: number;
    /** Ponctuation finale déterminant la pause. */
    punctuation: PausePunctuation;
    /** Vrai si le mot termine sa phrase. */
    endsSentence: boolean;
    /** Vrai si le mot termine son bloc (paragraphe, titre…). */
    endsBlock: boolean;
    /**
     * Vrai si ce mot est un segment non final d'un mot trop long découpé
     * (voir `maxWordLength`) ; l'interface l'affiche suivi d'un trait d'union.
     */
    continues: boolean;
}
export interface NormalizedDocument {
    /** Texte normalisé complet ; les blocs sont séparés par `\n\n`. */
    text: string;
    /** Langue utilisée pour la segmentation (BCP 47). */
    locale: string;
    blocks: Block[];
    sentences: Sentence[];
    tokens: Token[];
    words: Word[];
    /** Stratégie de segmentation effectivement utilisée. */
    segmentation: 'intl' | 'fallback';
}
