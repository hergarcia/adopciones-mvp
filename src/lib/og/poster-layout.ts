import { countCharacters } from '@/lib/pets/char-count'
import { EM_PER_CHARACTER } from './share-layout'

// El cartel para el estado de WhatsApp y las historias de Instagram (historia #275): vertical, del
// tamaño de una historia. Las medidas son de la imagen, no de la escala de la pantalla.
export const POSTER_SIZE = { width: 1080, height: 1920 }

export const POSTER_LAYOUT = {
  /** A los costados: lo que queda adentro es el ancho de cada texto. */
  margin: 72,
  /** Arriba y abajo: las apps tapan esa franja con el nombre de la cuenta y la caja de responder. */
  inset: 88,
  photo: { width: 540, height: 675 },
}

const COLUMN = POSTER_SIZE.width - POSTER_LAYOUT.margin * 2
const NAME_SIZE = { min: 64, max: 144, step: 4 }
const NAME_LINES = 2
const ADDRESS_SIZE = { min: 32, max: 64 }

// Cuántos renglones ocupa el nombre partido entre palabras, con la letra de ese cuerpo.
function nameLines(words: readonly number[], perLine: number): number {
  let lines = 1
  let used = 0
  for (const word of words) {
    const next = used === 0 ? word : used + 1 + word
    if (next <= perLine) used = next
    else {
      lines += 1
      used = word
    }
  }
  return lines
}

/**
 * El cuerpo del nombre en px: el más grande con el que cada palabra entra entera y el nombre ocupa
 * hasta dos renglones. Con 64 entran los 30 caracteres que permite el nombre en uno solo.
 */
export function posterNameSize(name: string): number {
  const words = name.split(' ').map(countCharacters)
  // Stryker disable next-line EqualityOperator: con 64 el resultado es 64 entre o no entre.
  for (let size = NAME_SIZE.max; size > NAME_SIZE.min; size -= NAME_SIZE.step) {
    const perLine = Math.floor(COLUMN / (size * EM_PER_CHARACTER))
    if (Math.max(...words) <= perLine && nameLines(words, perLine) <= NAME_LINES) return size
  }
  return NAME_SIZE.min
}

/** El cuerpo de la dirección en px: en un solo renglón, entre 32 y 64. */
export function posterAddressSize(address: string): number {
  const fits = Math.floor(COLUMN / (countCharacters(address) * EM_PER_CHARACTER))
  return Math.min(ADDRESS_SIZE.max, Math.max(ADDRESS_SIZE.min, fits))
}
