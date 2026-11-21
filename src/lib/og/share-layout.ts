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

// El cuadrado del centro es tan ancho como alta la imagen. La tira del nivel queda adentro, con 15
// px de cada lado, y su borde de tinta mide 8: una miniatura achica la imagen a un cuarto y con
// menos el borde desaparece.
const CENTER_WIDTH = SHARE_IMAGE_SIZE.height
export const PROFILE_LEVEL_STRIP = {
  width: CENTER_WIDTH - 30,
  border: 8,
  padding: { block: 40, inline: 28 },
}
const LEVEL_TEXT_WIDTH =
  PROFILE_LEVEL_STRIP.width - 2 * (PROFILE_LEVEL_STRIP.border + PROFILE_LEVEL_STRIP.padding.inline)
const LEVEL_SIZE = { min: 56, max: 96 }

/**
 * El mejor corte del texto en hasta dos renglones: el que deja más corto el renglón más largo. El
 * corte antes de la primera palabra es todo en un renglón. En un empate gana el de arriba más largo,
 * así «y avalada» queda junta abajo y no cuelga una «y» al final del primero.
 */
export function levelLines(text: string): string[] {
  const words = text.split(' ')
  const cuts = words.map((_, cut) =>
    [words.slice(0, cut).join(' '), words.slice(cut).join(' ')].filter((line) => line !== ''),
  )
  return cuts.reduce((best, lines) => (longestLine(lines) <= longestLine(best) ? lines : best))
}

function longestLine(lines: string[]): number {
  return Math.max(...lines.map(countCharacters))
}

/**
 * El cuerpo del nivel en la imagen del perfil, en px: tan grande como deje entrar su mejor corte
 * dentro de la tira, que va en el cuadrado del centro, lo que muestra una miniatura chica, entre 56
 * y 96.
 */
export function profileLevelSize(text: string): number {
  const fits = Math.floor(LEVEL_TEXT_WIDTH / (longestLine(levelLines(text)) * EM_PER_CHARACTER))
  return Math.min(LEVEL_SIZE.max, Math.max(LEVEL_SIZE.min, fits))
}
