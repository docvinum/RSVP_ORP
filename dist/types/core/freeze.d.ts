/**
 * Gèle récursivement un objet (objets et tableaux imbriqués). Les constantes
 * exportées (bornes, profils, libellés) servent de référence à la validation :
 * elles ne doivent pas pouvoir être modifiées à l'exécution, même depuis du
 * JavaScript non typé.
 */
export declare function deepFreeze<T>(value: T): T;
