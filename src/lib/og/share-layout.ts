import { countCharacters } from '@/lib/pets/char-count'
import { SHARE_IMAGE_SIZE } from './share-image'

// La vista previa en tres columnas: el nombre, la portada y la zona. Las de los textos terminan
// antes del cuadrado del centro (x 285 a 915 en 1200), que es lo que recorta una miniatura chica.
export const SHARE_LAYOUT = {
  margin: 48,
  column: 213,
  /** Lo que baja el primer renglón de cada texto: el borde de arriba de la foto y un poco más. */
  inset: 56,
}

// Una letra de la voz de afiche mide cerca de 0,4 eme (medido sobre la condensada ExtraBold, con
// margen para las anchas como la M): con eso, la palabra más larga del nombre entra en su columna
// sin partirse.
export const EM_PER_CHARACTER = 0.4
const NAME_SIZE = { min: 40, max: 128 }

/** El cuerpo del nombre en px: tan grande como deje su palabra más larga, entre 40 y 128. */
export function shareNameSize(name: string): number {
  const longest = Math.max(...name.split(' ').map(countCharacters))
  const fits = Math.floor(SHARE_LAYOUT.column / (longest * EM_PER_CHARACTER))
  return Math.min(NAME_SIZE.max, Math.max(NAME_SIZE.min, fits))
}

// El cuadrado del centro es tan ancho como alta la imagen.
const CENTER_WIDTH = SHARE_IMAGE_SIZE.height
const LEVEL_SIZE = { min: 56, max: 96 }

/** El renglón más largo del mejor corte del texto en dos; el corte antes de la primera palabra es
 * todo en un renglón. */
function longestOfTwoLines(text: string): number {
  const words = text.split(' ')
  return Math.min(
    ...words.map((_, cut) =>
      Math.max(
        countCharacters(words.slice(0, cut).join(' ')),
        countCharacters(words.slice(cut).join(' ')),
      ),
    ),
  )
}

/**
 * El cuerpo del nivel en la imagen del perfil, en px: tan grande como deje entrar el texto en hasta
 * dos renglones dentro del cuadrado del centro, que es lo que muestra una miniatura chica, entre 56
 * y 96.
 */
export function profileLevelSize(text: string): number {
  const fits = Math.floor(CENTER_WIDTH / (longestOfTwoLines(text) * EM_PER_CHARACTER))
  return Math.min(LEVEL_SIZE.max, Math.max(LEVEL_SIZE.min, fits))
}
