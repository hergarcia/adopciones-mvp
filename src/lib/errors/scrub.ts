const MAX_LENGTH = 200
const REMOVED = '…'

// En este orden: lo que va entre comillas o es el valor de una clave de Postgres (`Key (email)=(…)`)
// puede traer cualquier cosa, y sacarlo primero evita que el correo de adentro se lleve la clave; el
// UUID antes que los dígitos, que se comerían un tramo suyo. Siete dígitos o más, con o sin espacios,
// puntos o guiones, son un teléfono o una cédula; diez caracteres del alfabeto de los códigos, una
// ficha (`PET_CODE_PATTERN`).
const PERSONAL = [
  /(["'`]).*?\1/gu,
  /(?<==)\(.*?\)/gu,
  /\S+@\S+/gu,
  /[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}/giu,
  /\+?\d(?:[\s.-]?\d){6,}/gu,
  /\b[\da-hjkmnp-tv-z]{10}\b/gu,
]

/**
 * La descripción técnica de una falla sin nada que parezca un dato de una persona (FR-033): la
 * primera línea, sin lo que tiene forma de correo, teléfono, cédula, id o texto citado, hasta 200
 * caracteres. Si no queda ninguna letra, vacía: el aviso sale solo con la pantalla y el paso.
 */
export function scrub(message: string): string {
  const [firstLine] = message.split('\n')
  const scrubbed = PERSONAL.reduce((text, pattern) => text.replaceAll(pattern, REMOVED), firstLine)
    .trim()
    .slice(0, MAX_LENGTH)
  return /\p{L}/u.test(scrubbed) ? scrubbed : ''
}
