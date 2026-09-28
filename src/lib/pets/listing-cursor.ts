import { PET_CODE_PATTERN } from './rules'

// El cursor de «Ver más»: `(published_at, code)` de la última card cargada, tal como lo devuelve la
// base, con los microsegundos: redondearlo saltearía animales publicados en la misma milésima.
export type ListingCursor = { publishedAt: string; code: string }

// La forma exacta que devuelve la base. Un cursor con esa forma y una fecha que no existe (un mes 13)
// solo sale de una dirección armada a mano: la base lo rechaza y la tanda responde que el sitio no
// respondió, sin más daño.
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/

export function formatCursor(cursor: ListingCursor): string {
  return `${cursor.publishedAt}~${cursor.code}`
}

// Mal formado es como no haberlo mandado: la tanda empieza desde el principio.
export function parseCursor(raw: string | null | undefined): ListingCursor | null {
  const [publishedAt, code, ...rest] = String(raw).split('~')
  const valid = rest.length === 0 && TIMESTAMP.test(publishedAt) && PET_CODE_PATTERN.test(code)
  return valid ? { publishedAt, code } : null
}
