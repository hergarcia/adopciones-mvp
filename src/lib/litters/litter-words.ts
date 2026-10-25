// La interfaz dice «camada» y «cría», nunca «cachorro» ni «gatito» (FR-051).
const FORBIDDEN = /cachorr|gatit/iu

/** Las claves de un árbol de textos que usan una palabra prohibida, con su ruta. */
export function forbiddenLitterWords(tree: unknown, path = ''): string[] {
  if (typeof tree === 'string') return FORBIDDEN.test(tree) ? [path] : []
  return Object.entries(tree ?? {}).flatMap(([key, value]) =>
    forbiddenLitterWords(value, path === '' ? key : `${path}.${key}`),
  )
}
