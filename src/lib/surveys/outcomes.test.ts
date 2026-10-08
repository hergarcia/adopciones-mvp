// Covers: US1-AS14, US1-AS15, US1-AS16 (lo que ya había llegado es un éxito)
import { describe, expect, it } from 'vitest'
import { surveyOutcome } from './outcomes'

describe('surveyOutcome', () => {
  it.each(['answered', 'already', 'dismissed'] as const)('%s es un éxito', (outcome) => {
    expect(surveyOutcome(outcome)).toEqual({ ok: true })
  })

  it('not_found: la encuesta ya no está', () => {
    expect(surveyOutcome('not_found')).toEqual({ ok: false, error: 'surveys.errors.not_found' })
  })

  it('suspended: como una sesión que se cerró', () => {
    expect(surveyOutcome('suspended')).toEqual({ ok: false, error: 'surveys.errors.session' })
  })

  it('invalid: no se pudo', () => {
    expect(surveyOutcome('invalid')).toEqual({ ok: false, error: 'surveys.errors.failed' })
  })
})
