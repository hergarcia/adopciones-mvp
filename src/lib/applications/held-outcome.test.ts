// Covers: #289 US1-AS5, US1-AS7, US1-AS8 y el edge case «El pedido se rechaza mientras escribe»
// (contracts §holdApplication: cada resultado de dejarla escrita a su clave)
import { describe, expect, it } from 'vitest'
import { holdOutcome, type HoldRow } from './held-outcome'

const CODE = 'semana0001'

const row = (outcome: HoldRow['outcome'], ids: Partial<HoldRow> = {}): HoldRow => ({
  outcome,
  heldId: null,
  applicationId: null,
  ...ids,
})

const FAILED = { ok: false, error: 'applications.errors.failed' }

describe('holdOutcome', () => {
  it('quedó esperando la identidad, o el mismo intento que ya había quedado: la que espera', () => {
    for (const outcome of ['held', 'already'] as const) {
      expect(holdOutcome(row(outcome, { heldId: 'h1' }), CODE)).toEqual({
        ok: true,
        data: { kind: 'held', heldId: 'h1' },
      })
    }
  })

  it('ya tenía nivel 2 o el intento ya había salido: la solicitud mandada', () => {
    for (const outcome of ['sent', 'already'] as const) {
      expect(holdOutcome(row(outcome, { applicationId: 'a1' }), CODE)).toEqual({
        ok: true,
        data: { kind: 'sent', applicationId: 'a1' },
      })
    }
  })

  it('sin respuesta de la base, o guardada sin id, no se guardó', () => {
    expect(holdOutcome(null, CODE)).toEqual(FAILED)
    for (const outcome of ['held', 'already', 'sent'] as const) {
      expect(holdOutcome(row(outcome), CODE)).toEqual(FAILED)
    }
  })

  it('ya dejó una escrita por ese animal', () => {
    expect(holdOutcome(row('has_held', { heldId: 'h1' }), CODE)).toEqual({
      ok: false,
      error: 'applications.held.errors.has_held',
    })
  })

  it('el pedido de identidad ya no está en revisión: se queda en el cuestionario, sin ir a otro lado', () => {
    expect(holdOutcome(row('needs_identity'), CODE)).toEqual({
      ok: false,
      error: 'applications.held.errors.no_review',
    })
  })

  it('lo que comparte con mandar una solicitud dice lo mismo, con la solicitud activa', () => {
    expect(holdOutcome(row('has_active', { applicationId: 'a1' }), CODE)).toEqual({
      ok: false,
      error: 'applications.errors.has_active',
      detail: { id: 'a1' },
    })
    expect(holdOutcome(row('limit'), CODE)).toEqual({
      ok: false,
      error: 'applications.errors.limit',
    })
    expect(holdOutcome(row('answers_invalid'), CODE)).toEqual(FAILED)
  })
})
