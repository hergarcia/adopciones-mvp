// Las abreviaturas cuyo punto no cierra una oración (research R13 de la #8). Lista cerrada: una
// nueva en el texto se suma acá y a su test.
const ABBREVIATIONS = [
  'art.',
  'arts.',
  'inc.',
  'n.º',
  'nro.',
  'núm.',
  'dr.',
  'dra.',
  'sr.',
  'sra.',
  'etc.',
  'p. ej.',
]

const escape = (text: string) => text.replaceAll(/[.]/gu, '\\.')
const ABBREVIATION = new RegExp(`(?<!\\p{L})(?:${ABBREVIATIONS.map(escape).join('|')})`, 'giu')
// Un signo que cierra seguido de un espacio separa dos oraciones; el último no hace falta: lo que
// queda después del último corte ya es una.
const CLOSING = /[.?!][»”"')]*(?=\s)/gu
const ACRONYM = /(?:^|\s)(?:\p{L}\.){2,}$/u

/** Cuántas oraciones tiene un párrafo: las del primer párrafo de una página son de 1 a 3. */
export function sentenceCount(text: string): number {
  const plain = text.replaceAll(ABBREVIATION, 'abreviatura').trim()
  if (plain === '') return 0
  const cuts = [...plain.matchAll(CLOSING)].filter(
    (match) => !ACRONYM.test(plain.slice(0, match.index + 1)),
  )
  return cuts.length + 1
}
