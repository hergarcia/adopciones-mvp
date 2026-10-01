// Covers: FR-015, FR-019, US3-AS2, US3-AS12 y el Edge Case «"Ver más" con el último grupo exacto»
import { describe, expect, it } from 'vitest'
import { hasMore, loadMoreState, nextCursor } from './listing-page'

const rows = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    publishedAt: `2026-09-${String(28 - index).padStart(2, '0')}T12:00:00Z`,
    code: `k3x9p2qa${String(index).padStart(2, '0')}`,
  }))

describe('hasMore', () => {
  it('quedan más solo si llegó una de más', () => {
    expect(hasMore(rows(25), 24)).toBe(true)
    expect(hasMore(rows(24), 24)).toBe(false)
    expect(hasMore(rows(0), 24)).toBe(false)
  })
})

describe('nextCursor', () => {
  it('es la última que se muestra, no la de más', () => {
    expect(nextCursor(rows(4), 3)).toBe('2026-09-26T12:00:00Z~k3x9p2qa02')
  })

  it('sin una de más, no hay cursor', () => {
    expect(nextCursor(rows(3), 3)).toBeNull()
    expect(nextCursor(rows(0), 24)).toBeNull()
  })
})

describe('loadMoreState', () => {
  it('sin más, nada', () => {
    expect(loadMoreState(24, false, true)).toBe('none')
    expect(loadMoreState(24, false, false)).toBe('none')
  })

  it('con el navegador que ejecuta, el botón, sin tope', () => {
    expect(loadMoreState(24, true, true)).toBe('button')
    expect(loadMoreState(264, true, true)).toBe('button')
  })

  it('sin ejecutar, el enlace hasta 240, y ahí el aviso', () => {
    expect(loadMoreState(24, true, false)).toBe('link')
    expect(loadMoreState(216, true, false)).toBe('link')
    expect(loadMoreState(239, true, false)).toBe('link')
    expect(loadMoreState(240, true, false)).toBe('cap')
  })
})
