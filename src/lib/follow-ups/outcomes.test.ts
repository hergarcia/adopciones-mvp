// Covers: US2-AS5, US2-AS9, US2-AS10, US2-AS11, FR-013
import { describe, expect, it } from 'vitest'
import { followUpOutcome } from './outcomes'

describe('followUpOutcome', () => {
  it.each(['answered', 'already', 'staged'] as const)('%s es un éxito', (outcome) => {
    expect(followUpOutcome(outcome)).toEqual({ ok: true })
  })

  it.each(['closed', 'not_found', 'invalid', 'limit'] as const)('%s: su clave', (outcome) => {
    expect(followUpOutcome(outcome)).toEqual({
      ok: false,
      error: `follow_ups.errors.${outcome}`,
    })
  })

  it('suspended: como el pedido cerrado', () => {
    expect(followUpOutcome('suspended')).toEqual({ ok: false, error: 'follow_ups.errors.closed' })
  })
})
