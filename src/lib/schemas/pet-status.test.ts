// Covers: FR-002, FR-005 (lo que llega a las acciones de «Mis animales»)
import { describe, expect, it } from 'vitest'
import { PET_STATUS_ACTIONS } from '@/lib/pets/types'
import { petDeletionSchema, petStatusChangeSchema } from './pet-status'

const PET = '7b0c4a1e-2f3d-4c5b-8a9e-0f1e2d3c4b5a'

describe('petStatusChangeSchema', () => {
  it.each(PET_STATUS_ACTIONS)('acepta %s sobre un uuid', (action) => {
    expect(petStatusChangeSchema.safeParse({ petId: PET, action })).toEqual({
      success: true,
      data: { petId: PET, action },
    })
  })

  it('rechaza una acción que no existe', () => {
    expect(petStatusChangeSchema.safeParse({ petId: PET, action: 'take_down' }).success).toBe(false)
  })

  it('rechaza un id que no es un uuid', () => {
    expect(petStatusChangeSchema.safeParse({ petId: 'k3x9p2qa7m', action: 'pause' }).success).toBe(
      false,
    )
  })

  it('rechaza un campo de más', () => {
    const extra = { petId: PET, action: 'pause', status: 'adopted' }
    expect(petStatusChangeSchema.safeParse(extra).success).toBe(false)
  })
})

describe('petDeletionSchema', () => {
  it('acepta un uuid', () => {
    expect(petDeletionSchema.safeParse({ petId: PET })).toEqual({
      success: true,
      data: { petId: PET },
    })
  })

  it('rechaza un id que no es un uuid y un campo de más', () => {
    expect(petDeletionSchema.safeParse({ petId: 'nope' }).success).toBe(false)
    expect(petDeletionSchema.safeParse({ petId: PET, force: true }).success).toBe(false)
  })
})
