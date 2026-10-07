// Covers: US1-AS13, US3-AS2, US3-AS4, FR-001, FR-017, FR-018 y el Edge Case «Un reintento después
// de una respuesta perdida con un nombre repetido».
import { describe, expect, it, vi } from 'vitest'
import type { PetInput } from '@/lib/schemas/pet'
import { publishDecision, type SameSpeciesPet } from './publish-steps'

const data: PetInput = {
  name: 'Luna',
  species: 'dog',
  sex: 'female',
  age: { value: 2, unit: 'months' },
  size: 'medium',
  isNeutered: true,
  vaccines: 'up_to_date',
  hasChip: false,
  goodWithKids: 'unknown',
  goodWithDogs: 'unknown',
  goodWithCats: 'unknown',
  description: null,
  department: 'UY-MO',
  locality: 'Pocitos',
  isUrgent: false,
  requiredLevel: 1,
}

const invalid = { ok: false as const, errors: { name: { key: 'pets.errors.name_required' } } }

function facts(overrides: {
  attemptPublished?: boolean
  isLevelOne?: boolean
  validation?: { ok: true; data: PetInput } | typeof invalid
  pets?: SameSpeciesPet[]
  confirmDuplicate?: boolean
}) {
  const sameSpeciesPets = vi.fn<(species: string) => Promise<SameSpeciesPet[]>>(
    async () => overrides.pets ?? [],
  )
  const isLevelOne = vi.fn<() => Promise<boolean>>(async () => overrides.isLevelOne ?? true)
  return {
    attemptId: 'intento-1',
    confirmDuplicate: overrides.confirmDuplicate ?? false,
    validation: overrides.validation ?? { ok: true as const, data },
    attemptPublished: async () => overrides.attemptPublished ?? false,
    isLevelOne,
    sameSpeciesPets,
  }
}

const luna: SameSpeciesPet = { name: ' LÚNA', sex: 'female', attemptId: 'otro-intento' }

describe('publishDecision', () => {
  it('el intento ya publicado gana sobre el nivel, los campos y el nombre', async () => {
    const all = facts({
      attemptPublished: true,
      isLevelOne: false,
      validation: invalid,
      pets: [luna],
    })
    expect(await publishDecision(all)).toEqual({ kind: 'already' })
    expect(all.isLevelOne).not.toHaveBeenCalled()
    expect(all.sameSpeciesPets).not.toHaveBeenCalled()
  })

  it('después el nivel, antes que los campos y sin preguntar por los nombres', async () => {
    const noLevel = facts({ isLevelOne: false, validation: invalid, pets: [luna] })
    expect(await publishDecision(noLevel)).toEqual({ kind: 'needs_verification' })
    expect(noLevel.sameSpeciesPets).not.toHaveBeenCalled()
  })

  it('después los campos, antes que el nombre', async () => {
    const wrong = facts({ validation: invalid, pets: [luna] })
    expect(await publishDecision(wrong)).toEqual({ kind: 'invalid', errors: invalid.errors })
    expect(wrong.sameSpeciesPets).not.toHaveBeenCalled()
  })

  it('un nombre repetido en la misma especie avisa con el animal que ya existe', async () => {
    const repeated = facts({ pets: [{ name: 'Tobi', sex: 'male', attemptId: 'x' }, luna] })
    expect(await publishDecision(repeated)).toEqual({
      kind: 'duplicate_name',
      duplicate: { name: ' LÚNA', sex: 'female' },
    })
    expect(repeated.sameSpeciesPets).toHaveBeenCalledWith('dog')
  })

  it('el animal del propio intento no dispara el aviso', async () => {
    const own = facts({ pets: [{ ...luna, attemptId: 'intento-1' }] })
    expect(await publishDecision(own)).toEqual({ kind: 'publish', data })
  })

  it('con confirmDuplicate saltea solo el nombre', async () => {
    const confirmed = facts({ pets: [luna], confirmDuplicate: true })
    expect(await publishDecision(confirmed)).toEqual({ kind: 'publish', data })
    expect(confirmed.sameSpeciesPets).not.toHaveBeenCalled()

    const stillNoLevel = facts({ isLevelOne: false, confirmDuplicate: true })
    expect(await publishDecision(stillNoLevel)).toEqual({ kind: 'needs_verification' })
  })

  it('sin repetidos, publica', async () => {
    const fresh = facts({ pets: [{ name: 'Tobi', sex: 'male', attemptId: 'x' }] })
    expect(await publishDecision(fresh)).toEqual({ kind: 'publish', data })
  })
})
