/**
 * Si la clave de error de una acción es una falla del sitio o de un servicio —algo no anduvo
 * (`…_failed`, `…errors.failed`) o no se sabe qué pasó (`…errors.unknown`)— y no un rechazo por una
 * regla (FR-032): solo las fallas llegan al registro.
 */
export function isFaultKey(key: string): boolean {
  const last = key.slice(key.lastIndexOf('.') + 1)
  return last === 'failed' || last === 'unknown' || last.endsWith('_failed')
}
