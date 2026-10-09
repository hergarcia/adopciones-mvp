// Covers: FR-045 — cuántas se ven, leído de la dirección de «Ver más»
import { describe, expect, it } from 'vitest'
import { LIST_STEP, shownCount } from './newest-first'

describe('shownCount', () => {
  it('el tramo es de 50', () => {
    expect(LIST_STEP).toBe(50)
  })

  it.each([
    ['sin valor', undefined],
    ['repetido', ['100', '150']],
    ['en una lista', ['100']],
    ['vacío', ''],
    ['no numérico', 'muchas'],
    ['con espacio', ' 100'],
    ['con letras al final', '100a'],
    ['negativo', '-100'],
    ['de cinco cifras', '10000'],
    ['menos que un tramo', '49'],
  ])('%s → el primer tramo', (_, value) => {
    expect(shownCount(value)).toBe(LIST_STEP)
  })

  it.each([
    ['50', 50],
    ['51', 51],
    ['100', 100],
    ['1000', 1000],
    ['1001', 1000],
    ['9999', 1000],
  ])('%s → %i', (value, shown) => {
    expect(shownCount(value)).toBe(shown)
  })

  it.each([
    ['sin valor', undefined, 20],
    ['menos que el tramo', '19', 20],
    ['el tramo', '20', 20],
    ['uno más', '21', 21],
    ['dos tramos', '40', 40],
  ])('con un tramo de 20, %s → %i', (_, value, shown) => {
    expect(shownCount(value, 20)).toBe(shown)
  })
})
