// Sin opciones, Intl.Segmenter parte en grafemas.
const GRAPHEMES = new Intl.Segmenter('es')

// Cada letra, espacio o emoji cuenta como uno (spec, Edge Cases): una bandera son dos puntos de
// código y una familia con ZWJ son siete, y la persona ve uno.
export function countCharacters(text: string): number {
  let count = 0
  for (const _ of GRAPHEMES.segment(text)) count += 1
  return count
}
