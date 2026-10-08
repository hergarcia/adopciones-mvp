// Covers: US1-AS8, US1-AS10, FR-004, FR-055
import { describe, expect, it } from 'vitest'
import { commitmentOutcome, handoverOutcome } from './outcomes'

describe('handoverOutcome', () => {
  it.each(['done', 'already'] as const)('%s es un éxito', (outcome) => {
    expect(handoverOutcome(outcome)).toEqual({ ok: true })
  })

  it.each(['gone', 'you_blocked', 'revoked'] as const)(
    '%s: su clave y se vuelve a elegir entre las aceptadas de ahora',
    (outcome) => {
      expect(handoverOutcome(outcome)).toEqual({
        ok: false,
        error: `adoptions.handover.errors.${outcome}`,
        then: 'choose_again',
      })
    },
  )

  it.each(['changed', 'not_found'] as const)('%s: su clave y se ve cómo quedó', (outcome) => {
    expect(handoverOutcome(outcome)).toEqual({
      ok: false,
      error: `adoptions.handover.errors.${outcome}`,
      then: 'show_state',
    })
  })
})

// Covers: US2-AS6, US2-AS7, FR-013, FR-055
describe('commitmentOutcome', () => {
  it.each(['done', 'already'] as const)('%s es un éxito', (outcome) => {
    expect(commitmentOutcome(outcome)).toEqual({ ok: true })
  })

  it('not_found: como si no existiera', () => {
    expect(commitmentOutcome('not_found')).toEqual({
      ok: false,
      error: 'adoptions.commitment.errors.not_found',
    })
  })

  it.each(['closed', 'suspended'] as const)('%s: ya no se puede aceptar', (outcome) => {
    expect(commitmentOutcome(outcome)).toEqual({
      ok: false,
      error: 'adoptions.commitment.errors.closed',
    })
  })
})
