// Covers: FR-003, FR-006 (lo que llega a las acciones de una camada y de una cría)
import { describe, expect, it } from 'vitest'
import { litterStatusChangeSchema, youngStatusChangeSchema } from './litter-status'

const ID = '7b0c4a1e-2f3d-4c5b-8a9e-0f1e2d3c4b5a'
const ids = (count: number) =>
  Array.from({ length: count }, (_, index) => `7b0c4a1e-2f3d-4c5b-8a9e-0f1e2d3c4b${10 + index}`)

describe('youngStatusChangeSchema', () => {
  it.each(['mark_in_process', 'mark_available'] as const)('acepta %s', (action) => {
    expect(youngStatusChangeSchema.safeParse({ petId: ID, action })).toEqual({
      success: true,
      data: { petId: ID, action },
    })
  })

  it.each(['mark_adopted', 'pause', 'republish'])('rechaza %s: no es de una cría', (action) => {
    expect(youngStatusChangeSchema.safeParse({ petId: ID, action }).success).toBe(false)
  })

  it('rechaza un id que no es un uuid y un campo de más', () => {
    expect(
      youngStatusChangeSchema.safeParse({ petId: 'k3x9', action: 'mark_available' }).success,
    ).toBe(false)
    const extra = { petId: ID, action: 'mark_available', youngIds: [ID] }
    expect(youngStatusChangeSchema.safeParse(extra).success).toBe(false)
  })
})

describe('litterStatusChangeSchema', () => {
  it.each(['pause', 'resume', 'renew', 'republish'] as const)('acepta %s sin crías', (action) => {
    expect(litterStatusChangeSchema.safeParse({ litterId: ID, action })).toEqual({
      success: true,
      data: { litterId: ID, action },
    })
  })

  it.each(['pause', 'resume', 'renew'])('rechaza crías en %s', (action) => {
    expect(
      litterStatusChangeSchema.safeParse({ litterId: ID, action, youngIds: [ID] }).success,
    ).toBe(false)
  })

  it('volver a publicar lleva de 1 a 10 crías', () => {
    for (const count of [1, 10]) {
      const input = { litterId: ID, action: 'republish', youngIds: ids(count) }
      expect(litterStatusChangeSchema.safeParse(input)).toEqual({ success: true, data: input })
    }
    for (const count of [0, 11]) {
      const input = { litterId: ID, action: 'republish', youngIds: ids(count) }
      expect(litterStatusChangeSchema.safeParse(input).success).toBe(false)
    }
  })

  it('rechaza una cría que no es un uuid, una acción de cría y un campo de más', () => {
    const bad = { litterId: ID, action: 'republish', youngIds: ['nope'] }
    expect(litterStatusChangeSchema.safeParse(bad).success).toBe(false)
    expect(
      litterStatusChangeSchema.safeParse({ litterId: ID, action: 'mark_available' }).success,
    ).toBe(false)
    expect(litterStatusChangeSchema.safeParse({ litterId: 'x', action: 'pause' }).success).toBe(
      false,
    )
    const extra = { litterId: ID, action: 'pause', petId: ID }
    expect(litterStatusChangeSchema.safeParse(extra).success).toBe(false)
  })
})
