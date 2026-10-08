// Covers: US1-AS8, US1-AS10, FR-004, FR-055
import { describe, expect, it } from 'vitest'
import { handoverOutcome } from './outcomes'

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
