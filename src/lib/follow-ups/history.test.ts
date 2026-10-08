// Covers: US3-AS1, US3-AS3, US3-AS4, FR-040, FR-041, FR-042 (las líneas del historial, sin cero)
import { describe, expect, it } from 'vitest'
import { historyLines } from './history'

describe('historyLines', () => {
  it('sin ninguna, ninguna línea en ningún lugar', () => {
    const none = { given: 0, adopted: 0 }
    expect(historyLines(none, 'both')).toEqual([])
    expect(historyLines(none, 'given')).toEqual([])
    expect(historyLines(none, 'adopted')).toEqual([])
  })

  it('solo dio: la línea de dio, y nada donde se muestra lo adoptado', () => {
    const given = { given: 2, adopted: 0 }
    expect(historyLines(given, 'both')).toEqual([{ kind: 'given', count: 2 }])
    expect(historyLines(given, 'given')).toEqual([{ kind: 'given', count: 2 }])
    expect(historyLines(given, 'adopted')).toEqual([])
  })

  it('solo adoptó: la línea de adoptó, y nada donde se muestra lo dado', () => {
    const adopted = { given: 0, adopted: 1 }
    expect(historyLines(adopted, 'both')).toEqual([{ kind: 'adopted', count: 1 }])
    expect(historyLines(adopted, 'adopted')).toEqual([{ kind: 'adopted', count: 1 }])
    expect(historyLines(adopted, 'given')).toEqual([])
  })

  it('los dos: las dos líneas en el perfil, dio primero; cada lugar, la suya', () => {
    const both = { given: 2, adopted: 1 }
    expect(historyLines(both, 'both')).toEqual([
      { kind: 'given', count: 2 },
      { kind: 'adopted', count: 1 },
    ])
    expect(historyLines(both, 'given')).toEqual([{ kind: 'given', count: 2 }])
    expect(historyLines(both, 'adopted')).toEqual([{ kind: 'adopted', count: 1 }])
  })

  it('uno cuenta: el borde entre mostrar y no mostrar', () => {
    expect(historyLines({ given: 1, adopted: 1 }, 'both')).toEqual([
      { kind: 'given', count: 1 },
      { kind: 'adopted', count: 1 },
    ])
  })
})
