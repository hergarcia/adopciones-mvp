// Covers: FR-002, FR-006 y Edge Cases «Filtros que el listado junta» (dos avisos que el listado
// busca igual son el mismo), FR-037 (cuántos filtros)
import { describe, expect, it } from 'vitest'
import { NO_FILTERS } from '@/lib/pets/listing-query'
import { countFilters, normalizeAlertFilters } from './filters'

describe('normalizeAlertFilters', () => {
  it('ordena cada filtro como el vocabulario y saca los repetidos', () => {
    expect(
      normalizeAlertFilters({
        species: ['cat'],
        sex: ['female', 'female'],
        size: ['large', 'small'],
        age: ['senior', 'puppy'],
        department: ['UY-CA'],
        neutered: [],
      }),
    ).toEqual({
      species: ['cat'],
      sex: ['female'],
      size: ['small', 'large'],
      age: ['puppy', 'senior'],
      department: ['UY-CA'],
      neutered: [],
    })
  })

  it('todas las opciones de un filtro son ninguna', () => {
    expect(
      normalizeAlertFilters({
        species: ['dog', 'cat'],
        sex: ['male', 'female'],
        size: ['small', 'medium', 'large'],
        age: ['puppy', 'young', 'adult', 'senior'],
        department: [],
        neutered: [],
      }),
    ).toEqual(NO_FILTERS)
  })

  it('de varios departamentos queda uno', () => {
    expect(normalizeAlertFilters({ ...NO_FILTERS, department: ['UY-SA', 'UY-AR'] })).toEqual({
      ...NO_FILTERS,
      department: ['UY-AR'],
    })
  })

  it('castrado tiene una sola opción y queda', () => {
    expect(normalizeAlertFilters({ ...NO_FILTERS, neutered: ['yes'] })).toEqual({
      ...NO_FILTERS,
      neutered: ['yes'],
    })
  })
})

describe('countFilters', () => {
  it('sin filtros es 0', () => {
    expect(countFilters(NO_FILTERS)).toBe(0)
  })

  it('cuenta filtros, no opciones', () => {
    expect(countFilters({ ...NO_FILTERS, size: ['small', 'medium'] })).toBe(1)
  })

  it.each([
    ['species', { species: ['dog' as const] }],
    ['sex', { sex: ['male' as const] }],
    ['size', { size: ['large' as const] }],
    ['age', { age: ['adult' as const] }],
    ['department', { department: ['UY-MO' as const] }],
    ['neutered', { neutered: ['yes' as const] }],
  ])('cuenta %s', (_, filters) => {
    expect(countFilters({ ...NO_FILTERS, ...filters })).toBe(1)
  })

  it('con los seis es 6', () => {
    expect(
      countFilters({
        species: ['dog'],
        sex: ['female'],
        size: ['small'],
        age: ['puppy'],
        department: ['UY-MO'],
        neutered: ['yes'],
      }),
    ).toBe(6)
  })
})
