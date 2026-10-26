/**
 * Codes d'erreur publics :
 * - `INVALID_SOURCE` : source absente, de type inconnu ou mal formée ;
 * - `EMPTY_CONTENT` : la source ne contient aucun mot lisible ;
 * - `PARSE_ERROR` : échec inattendu de l'extraction ;
 * - `ENVIRONMENT` : API navigateur requise indisponible (DOMParser, customElements…) ;
 * - `DESTROYED` : appel d'`open()` sur un lecteur détruit ;
 * - `ABORTED` : ouverture rendue caduque par un `open()`, `close()` ou `destroy()`
 *   ultérieur, y compris appelé depuis un abonné (non bloquant) ;
 * - `STORAGE` : lecture/écriture des préférences impossible (non bloquant) ;
 * - `LISTENER` : un abonné aux événements a levé une exception (non bloquant).
 */
export type ReaderErrorCode = 'INVALID_SOURCE' | 'EMPTY_CONTENT' | 'PARSE_ERROR' | 'ENVIRONMENT' | 'DESTROYED' | 'ABORTED' | 'STORAGE' | 'LISTENER';
export declare class ReaderError extends Error {
    readonly code: ReaderErrorCode;
    /** `false` si la lecture peut continuer (ex. : erreur de stockage). */
    readonly fatal: boolean;
    constructor(code: ReaderErrorCode, message: string, options?: {
        cause?: unknown;
        fatal?: boolean;
    });
}
export declare function isReaderError(e: unknown): e is ReaderError;
