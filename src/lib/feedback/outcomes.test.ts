// Covers: US2-AS7 (la sexta del día), US2-AS8 y US2-AS9 (lo que ya había llegado es un envío)
import { describe, expect, it } from 'vitest'
import { feedbackOutcome } from './outcomes'

describe('feedbackOutcome', () => {
  it.each(['sent', 'already'] as const)('%s es un envío', (outcome) => {
    expect(feedbackOutcome(outcome)).toEqual({ ok: true })
  })

  it('limit: ya mandó varias hoy', () => {
    expect(feedbackOutcome('limit')).toEqual({ ok: false, error: 'feedback.errors.limit' })
  })

  it('invalid: no se pudo', () => {
    expect(feedbackOutcome('invalid')).toEqual({ ok: false, error: 'feedback.errors.failed' })
  })
})
