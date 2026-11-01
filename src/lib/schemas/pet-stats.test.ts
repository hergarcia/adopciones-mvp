import { describe, expect, it } from 'vitest'
import { petStatsRequestSchema } from './pet-stats'

const ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7'

// Covers: FR-025 (lo que llega a la acción que lee los números)
describe('qué números se piden', () => {
  it.each(['pet', 'litter'] as const)('los de %s', (kind) => {
    expect(petStatsRequestSchema.parse({ kind, id: ID })).toEqual({ kind, id: ID })
  })

  it('otra clase no existe', () => {
    expect(petStatsRequestSchema.safeParse({ kind: 'young', id: ID }).success).toBe(false)
  })

  it('un id que no es uuid no existe', () => {
    expect(petStatsRequestSchema.safeParse({ kind: 'pet', id: 'abcdefghjk' }).success).toBe(false)
  })

  it('una propiedad de más no pasa', () => {
    expect(petStatsRequestSchema.safeParse({ kind: 'pet', id: ID, owner: ID }).success).toBe(false)
  })
})
