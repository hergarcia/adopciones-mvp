// Las iniciales son el marcador de posición de la foto (FR-024): sin foto, lo que se muestra es
// esto y no un contorno genérico de persona.
//
// Con `match` y no con `trim().split()`: eso último necesita recortar **y** filtrar vacíos, dos
// protecciones que se tapan entre sí, así que ninguna de las dos se puede demostrar necesaria.
export function initials(displayName: string): string {
  const words = displayName.match(/\S+/gu) ?? []
  const chosen = words.length > 1 ? `${words[0]} ${words[words.length - 1]}` : (words[0] ?? '')

  // La primera letra de cada palabra, por punto de código: un nombre puede empezar con una letra
  // fuera del plano básico, y cortarla por unidad dejaría medio carácter.
  return (chosen.match(/(?<=^|\s)\S/gu) ?? []).join('').toLocaleUpperCase('es')
}
