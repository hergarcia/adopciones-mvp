// Covers: FR-045 — «Ver más» no pierde ninguna: la base entrega de a 100 y se pide una de más para
// saber si queda algo
import { describe, expect, it } from 'vitest'
import { NEWEST_CURSOR, readNewest } from './newest-first'

// Una base de `total` filas numeradas de la más nueva a la más vieja, que entrega después de la
// última recibida. Corta a las 10 llamadas: un bucle que no termina falla en vez de colgar.
function fakeBase(total: number) {
  const rows = Array.from({ length: total }, (_, index) => index)
  const calls: { after: number | undefined; limit: number }[] = []
  async function page(after: number | undefined, limit: number) {
    calls.push({ after, limit })
    if (calls.length > 10) throw new Error('demasiadas llamadas')
    const start = after === undefined ? 0 : after + 1
    return rows.slice(start, start + limit)
  }
  return { page, calls }
}

describe('readNewest', () => {
  it('con menos de las que se ven, todas y sin «Ver más»', async () => {
    const base = fakeBase(3)
    expect(await readNewest(5, base.page)).toEqual({ items: [0, 1, 2], hasMore: false })
    expect(base.calls).toEqual([{ after: undefined, limit: 6 }])
  })

  it('con exactamente las que se ven, sin «Ver más»', async () => {
    const base = fakeBase(5)
    expect(await readNewest(5, base.page)).toEqual({ items: [0, 1, 2, 3, 4], hasMore: false })
  })

  it('con una más de las que se ven, «Ver más» y sin mostrar la de más', async () => {
    const base = fakeBase(6)
    expect(await readNewest(5, base.page)).toEqual({ items: [0, 1, 2, 3, 4], hasMore: true })
    expect(base.calls).toEqual([{ after: undefined, limit: 6 }])
  })

  it('más de 100: de a 100, cada tramo después de la última que llegó', async () => {
    const base = fakeBase(250)
    const { items, hasMore } = await readNewest(150, base.page)
    expect(items).toEqual(Array.from({ length: 150 }, (_, index) => index))
    expect(hasMore).toBe(true)
    expect(base.calls).toEqual([
      { after: undefined, limit: 100 },
      { after: 99, limit: 51 },
    ])
  })

  it('un tramo lleno pide el siguiente; uno corto termina', async () => {
    const base = fakeBase(100)
    expect(await readNewest(150, base.page)).toEqual({
      items: Array.from({ length: 100 }, (_, index) => index),
      hasMore: false,
    })
    expect(base.calls).toEqual([
      { after: undefined, limit: 100 },
      { after: 99, limit: 51 },
    ])
  })
})

describe('NEWEST_CURSOR', () => {
  it('empieza después del último día y el último id posibles', () => {
    expect(NEWEST_CURSOR).toEqual({ day: '9999-12-31', id: 'ffffffff-ffff-ffff-ffff-ffffffffffff' })
  })
})
