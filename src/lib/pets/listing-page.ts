import { formatCursor } from './listing-cursor'
import { LISTING_MAX_SHOWN } from './rules'

// Se pide una de más: si llega, queda al menos otra para «Ver más» (research R4).
export function hasMore(rows: unknown[], shown: number): boolean {
  return rows.length > shown
}

/** El cursor de la última que se muestra, o null si no queda ninguna para «Ver más». */
export function nextCursor(
  rows: { publishedAt: string; code: string }[],
  shown: number,
): string | null {
  return hasMore(rows, shown) ? formatCursor(rows[shown - 1]) : null
}

export type LoadMoreState = 'none' | 'button' | 'link' | 'cap'

// Con el navegador que ejecuta, un botón que suma de a una tanda y sin tope; sin ejecutar, un
// enlace que vuelve a pedir el listado con 24 más, hasta 240, y ahí el aviso (FR-019).
export function loadMoreState(shown: number, more: boolean, hydrated: boolean): LoadMoreState {
  if (!more) return 'none'
  if (hydrated) return 'button'
  return shown < LISTING_MAX_SHOWN ? 'link' : 'cap'
}
