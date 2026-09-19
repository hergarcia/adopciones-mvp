// Quien escribe en un teléfono no pone tildes: «cordon» tiene que encontrar «Cordón», y «RIVERA»
// tiene que encontrar «Rivera». La comparación normaliza las dos puntas; lo que se muestra y lo
// que se guarda es siempre el texto bien escrito.
function fold(value: string): string {
  const withoutAccents = value.normalize('NFD').replace(/\p{Diacritic}/gu, '')

  // Stryker disable next-line MethodExpression: equivalente — las dos puntas se doblan igual, así
  // que pasarlas a mayúsculas en vez de a minúsculas compara exactamente lo mismo.
  const lowered = withoutAccents.toLocaleLowerCase('es')

  // En su propia línea a propósito: la anotación de arriba desactiva el mutador para toda la
  // línea, y sacar el recorte **sí** es observable —«  pocit  » dejaría de encontrar «Pocitos»—,
  // así que compartiendo línea la anotación taparía un mutante que un test mata.
  return lowered.trim()
}

export function matchLocalities(
  localities: readonly string[],
  query: string,
  limit = 8,
): readonly string[] {
  const needle = fold(query)
  if (needle.length === 0) return []
  const exact = query.trim()

  const starts: string[] = []
  const contains: string[] = []

  for (const locality of localities) {
    // Solo se descarta lo que ya escribió **igual**, con sus tildes: si escribió «cordon», la
    // sugerencia «Cordón» es precisamente la que necesita para que quede bien escrito.
    if (locality === exact) continue

    const haystack = fold(locality)
    if (haystack.startsWith(needle)) starts.push(locality)
    else if (haystack.includes(needle)) contains.push(locality)
  }

  // Lo que empieza igual va primero: quien escribe «pun» busca Punta Carretas antes que
  // Jardines del Hipódromo.
  return [...starts, ...contains].slice(0, limit)
}
