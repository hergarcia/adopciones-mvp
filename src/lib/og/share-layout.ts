import { countCharacters } from '@/lib/pets/char-count'

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
const EM_PER_CHARACTER = 0.4
const NAME_SIZE = { min: 40, max: 128 }

/** El cuerpo del nombre en px: tan grande como deje su palabra más larga, entre 40 y 128. */
export function shareNameSize(name: string): number {
  const longest = Math.max(...name.split(' ').map(countCharacters))
  const fits = Math.floor(SHARE_LAYOUT.column / (longest * EM_PER_CHARACTER))
  return Math.min(NAME_SIZE.max, Math.max(NAME_SIZE.min, fits))
}
