// Quien escribe en un teléfono no pone tildes: «cordon» tiene que encontrar «Cordón», y «RIVERA»
// tiene que encontrar «Rivera». La comparación normaliza las dos puntas; lo que se muestra y lo
// que se guarda es siempre el texto bien escrito.
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
    .trim()
}

export function matchLocalities(
  localities: readonly string[],
  query: string,
  limit = 8,
): readonly string[] {
  const needle = fold(query)
  if (needle.length === 0) return []

  const starts: string[] = []
  const contains: string[] = []

  for (const locality of localities) {
    const haystack = fold(locality)
    // Si ya escribió el nombre entero no hay nada que sugerirle: la lista se cierra sola.
    if (haystack === needle) continue
    if (haystack.startsWith(needle)) starts.push(locality)
    else if (haystack.includes(needle)) contains.push(locality)
  }

  // Lo que empieza igual va primero: quien escribe «pun» busca Punta Carretas antes que
  // Jardines del Hipódromo.
  return [...starts, ...contains].slice(0, limit)
}
