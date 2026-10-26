// La interfaz dice «camada» y «cría», nunca «cachorro» ni «gatito» (FR-051).
const FORBIDDEN = /cachorr|gatit/iu

/** Las claves de un árbol de textos que usan una palabra prohibida, con su ruta. */
export function forbiddenLitterWords(tree: unknown, path = ''): string[] {
  if (typeof tree === 'string') return FORBIDDEN.test(tree) ? [path] : []
  return Object.entries(tree ?? {}).flatMap(([key, value]) =>
    forbiddenLitterWords(value, path === '' ? key : `${path}.${key}`),
  )
}

/**
 * Cómo se nombra una cría con su camada (historia #206): `own` cuando el nombre de la camada ya dice
 * «camada» («La camada de Luna» → «camada de Luna»), `quoted` cuando no («Los del galpón», entre
 * comillas), `none` para un animal suelto. Los textos eligen la forma con un `select`.
 */
export type YoungLabel = { form: 'own' | 'quoted' | 'none'; name: string; litter: string }

const LITTER_WORD = /^(?:la\s+)?camada\b/iu
const ARTICLE = /^la\s+/iu

export function youngLabel({
  name,
  litterName,
}: {
  name: string
  litterName: string | null
}): YoungLabel {
  if (litterName === null) return { form: 'none', name, litter: '' }
  const trimmed = litterName.trim()
  if (!LITTER_WORD.test(trimmed)) return { form: 'quoted', name, litter: trimmed }
  const own = trimmed.replace(ARTICLE, '')
  return { form: 'own', name, litter: `c${own.slice(1)}` }
}
