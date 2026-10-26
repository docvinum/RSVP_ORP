/**
 * Gèle récursivement un objet (objets et tableaux imbriqués). Les constantes
 * exportées (bornes, profils, libellés) servent de référence à la validation :
 * elles ne doivent pas pouvoir être modifiées à l'exécution, même depuis du
 * JavaScript non typé.
 */
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Reflect.ownKeys(value)) deepFreeze((value as Record<PropertyKey, unknown>)[key]);
  }
  return value;
}
