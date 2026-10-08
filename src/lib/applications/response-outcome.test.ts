// Covers: FR-011, FR-044, FR-064, US1-AS11, US1-AS12, US2-AS7 (lo que ve el publicador al responder);
// FR-030 a FR-032, US3-AS2, US3-AS3 (preguntar y contestar)
import { describe, expect, it } from 'vitest'
import { acceptOutcome, answerOutcome, askOutcome, rejectOutcome } from './response-outcome'

const ID = '7b0c4a1e-2f3d-4c5b-8a9e-0f1e2d3c4b5a'

describe('acceptOutcome', () => {
  it('aceptada, con si fue la primera respuesta', () => {
    expect(acceptOutcome({ outcome: 'accepted', firstResponse: true }, ID)).toEqual({
      ok: true,
      data: { firstResponse: true },
    })
  })

  it('un doble toque cuenta como aceptada', () => {
    expect(acceptOutcome({ outcome: 'already_accepted', firstResponse: false }, ID)).toEqual({
      ok: true,
      data: { firstResponse: false },
    })
  })

  it('sin su teléfono, al aviso de verificación con la vuelta y el origen en la solicitud', () => {
    expect(acceptOutcome({ outcome: 'publisher_needs_phone', firstResponse: false }, ID)).toEqual({
      ok: false,
      error: 'inbox.errors.publisher_needs_phone',
      detail: {
        redirect: `/verificar-telefono?para=aceptar&next=%2Fsolicitudes%2F${ID}&desde=%2Fsolicitudes%2F${ID}`,
      },
    })
  })

  it.each([
    'rejected',
    'gone',
    'you_blocked',
    'closed',
    'applicant_needs_phone',
    'not_found',
  ] as const)('%s: no cambia nada y lo dice', (outcome) => {
    expect(acceptOutcome({ outcome, firstResponse: false }, ID)).toEqual({
      ok: false,
      error: `inbox.errors.${outcome}`,
    })
  })

  it('sin respuesta de la base, el error genérico', () => {
    expect(acceptOutcome(null, ID)).toEqual({ ok: false, error: 'inbox.errors.failed' })
  })
})

describe('rejectOutcome', () => {
  it('rechazada, o ya lo estaba (doble toque): hecho', () => {
    expect(rejectOutcome({ outcome: 'rejected' })).toEqual({ ok: true, data: null })
    expect(rejectOutcome({ outcome: 'already_rejected' })).toEqual({ ok: true, data: null })
  })

  it.each(['accepted', 'not_accepted', 'gone', 'you_blocked', 'closed', 'not_found'] as const)(
    '%s: no cambia nada y lo dice',
    (outcome) => {
      expect(rejectOutcome({ outcome })).toEqual({ ok: false, error: `inbox.errors.${outcome}` })
    },
  )

  it('una línea que la base no guardó, o sin respuesta de la base, el error genérico', () => {
    expect(rejectOutcome({ outcome: 'invalid' })).toEqual({
      ok: false,
      error: 'inbox.errors.failed',
    })
    expect(rejectOutcome(null)).toEqual({ ok: false, error: 'inbox.errors.failed' })
  })
})

describe('askOutcome', () => {
  it('preguntada, o el mismo intento otra vez (doble toque): hecho', () => {
    expect(askOutcome({ outcome: 'asked' })).toEqual({ ok: true, data: null })
    expect(askOutcome({ outcome: 'already' })).toEqual({ ok: true, data: null })
  })

  it.each([
    'pending',
    'limit',
    'not_waiting',
    'gone',
    'you_blocked',
    'closed',
    'not_found',
  ] as const)('%s: no cambia nada y lo dice', (outcome) => {
    expect(askOutcome({ outcome })).toEqual({ ok: false, error: `inbox.errors.${outcome}` })
  })

  it('un texto que la base no guardó, o sin respuesta de la base, el error genérico', () => {
    expect(askOutcome({ outcome: 'invalid' })).toEqual({ ok: false, error: 'inbox.errors.failed' })
    expect(askOutcome(null)).toEqual({ ok: false, error: 'inbox.errors.failed' })
  })
})

describe('answerOutcome', () => {
  it('contestada, o ya lo estaba (doble toque): hecho', () => {
    expect(answerOutcome({ outcome: 'answered' })).toEqual({ ok: true, data: null })
    expect(answerOutcome({ outcome: 'already_answered' })).toEqual({ ok: true, data: null })
  })

  it.each(['not_active', 'not_found'] as const)('%s: no guarda y lo dice', (outcome) => {
    expect(answerOutcome({ outcome })).toEqual({
      ok: false,
      error: `applications.answer.errors.${outcome}`,
    })
  })

  it('un texto que la base no guardó, o sin respuesta de la base, el error genérico', () => {
    const failed = { ok: false, error: 'applications.answer.errors.failed' }
    expect(answerOutcome({ outcome: 'invalid' })).toEqual(failed)
    expect(answerOutcome(null)).toEqual(failed)
  })
})
