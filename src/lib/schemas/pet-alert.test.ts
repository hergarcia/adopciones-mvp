// Covers: US1-AS1, US1-AS5, FR-002 y Edge Cases «Filtros que el listado junta» (lo que manda el
// listado al crear un aviso)
import { describe, expect, it } from 'vitest'
import { NO_FILTERS } from '@/lib/pets/listing-query'
import { petAlertSchema } from './pet-alert'

const input = (filters: Record<string, unknown>, fromEmpty: unknown = false) => ({
  filters: { ...NO_FILTERS, ...filters },
  fromEmpty,
})

describe('petAlertSchema', () => {
  it('acepta los seis filtros y los devuelve normalizados', () => {
    const parsed = petAlertSchema.safeParse(
      input(
        {
          species: ['dog'],
          sex: ['female'],
          size: ['medium', 'small', 'small'],
          age: ['puppy', 'young', 'adult', 'senior'],
          department: ['UY-MO'],
          neutered: ['yes'],
        },
        true,
      ),
    )
    expect(parsed).toEqual({
      success: true,
      data: {
        filters: {
          species: ['dog'],
          sex: ['female'],
          size: ['small', 'medium'],
          age: [],
          department: ['UY-MO'],
          neutered: ['yes'],
        },
        fromEmpty: true,
      },
    })
  })

  it('sin filtros también es un aviso', () => {
    expect(petAlertSchema.safeParse(input({}))).toEqual({
      success: true,
      data: { filters: NO_FILTERS, fromEmpty: false },
    })
  })

  it.each([
    ['una especie', { species: ['horse'] }],
    ['un sexo', { sex: ['other'] }],
    ['un tamaño', { size: ['huge'] }],
    ['un tramo de edad', { age: ['old'] }],
    ['un departamento', { department: ['UY-XX'] }],
    ['castrado', { neutered: ['no'] }],
  ])('rechaza un valor desconocido en %s', (_, filters) => {
    const parsed = petAlertSchema.safeParse(input(filters))
    expect(parsed.success).toBe(false)
  })

  it('rechaza un filtro que falta o uno de más, con la clave de error del aviso', () => {
    const { species: _, ...withoutSpecies } = NO_FILTERS
    const missing = petAlertSchema.safeParse({ filters: withoutSpecies, fromEmpty: false })
    const extra = petAlertSchema.safeParse(input({ color: ['black'] }))
    expect(missing.success).toBe(false)
    expect(extra.error?.issues[0]?.message).toBe('alerts.errors.failed')
  })

  it('rechaza una propiedad de más afuera de los filtros', () => {
    const parsed = petAlertSchema.safeParse({ ...input({}), page: 2 })
    expect(parsed.error?.issues[0]?.message).toBe('alerts.errors.failed')
  })

  it('rechaza fromEmpty que no es booleano', () => {
    expect(petAlertSchema.safeParse(input({}, 'true')).success).toBe(false)
    expect(petAlertSchema.safeParse({ filters: NO_FILTERS }).success).toBe(false)
  })
})
