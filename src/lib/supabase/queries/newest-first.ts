// Las listas de quien administra, de la más nueva a la más vieja (research R12): la base entrega de
// a 100 como mucho, después de la última que ya entregó. Se piden las que se ven y una más, que es
// la que dice si queda algo para «Ver más».
const PAGE_MAX = 100

// El primer tramo: las funciones comparan `(día, id) < (antes, id)` y no reciben nulos desde los
// tipos generados, así que se empieza después de la última posible.
export const NEWEST_CURSOR = { day: '9999-12-31', id: 'ffffffff-ffff-ffff-ffff-ffffffffffff' }

type Page<T> = (after: T | undefined, limit: number) => Promise<T[]>

export async function readNewest<T>(
  count: number,
  page: Page<T>,
): Promise<{ items: T[]; hasMore: boolean }> {
  const items: T[] = []
  const wanted = count + 1
  while (items.length < wanted) {
    const limit = Math.min(wanted - items.length, PAGE_MAX)
    // oxlint-disable-next-line no-await-in-loop -- cada tramo empieza después del anterior
    const rows = await page(items.at(-1), limit)
    items.push(...rows)
    if (rows.length < limit) break
  }
  return { items: items.slice(0, count), hasMore: items.length > count }
}
