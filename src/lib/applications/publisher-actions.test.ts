// Covers: FR-007, FR-011, FR-031, US1-AS12, US1-AS13, US1-AS16 (qué se ofrece al publicador);
// historia #257: US1-AS5, US1-AS11, FR-001, FR-005 (pedirle la identidad)
import { describe, expect, it } from 'vitest'
import { publisherActions } from './publisher-actions'
import { APPLICATION_STATUSES } from './types'

const WAITING = {
  status: 'sent' as const,
  applicantHasPhone: true,
  publisherHasPhone: true,
  questionsAsked: 0,
  questionPending: false,
  identityAsk: null,
  applicantIdentityVerified: false,
}

describe('publisherActions', () => {
  it('esperando respuesta, con los dos teléfonos: aceptar, rechazar y las 3 preguntas', () => {
    expect(publisherActions(WAITING)).toEqual({
      accept: 'offer',
      reject: true,
      ask: { kind: 'offer', remaining: 3 },
      revoke: false,
      identityAsk: 'offer',
    })
  })

  it('sin el teléfono de quien solicitó, aceptar frenado; rechazar y preguntar siguen', () => {
    expect(publisherActions({ ...WAITING, applicantHasPhone: false })).toEqual({
      accept: 'applicant_needs_phone',
      reject: true,
      ask: { kind: 'offer', remaining: 3 },
      revoke: false,
      identityAsk: 'offer',
    })
  })

  it('sin el teléfono del publicador, el aviso de verificación va primero, aunque falten los dos', () => {
    expect(publisherActions({ ...WAITING, publisherHasPhone: false })).toEqual({
      accept: 'publisher_needs_phone',
      reject: true,
      ask: { kind: 'offer', remaining: 3 },
      revoke: false,
      identityAsk: 'offer',
    })
    expect(
      publisherActions({ ...WAITING, publisherHasPhone: false, applicantHasPhone: false }).accept,
    ).toBe('publisher_needs_phone')
  })

  it('cuenta las que quedan; con las 3 hechas no se ofrece preguntar', () => {
    expect(publisherActions({ ...WAITING, questionsAsked: 2 }).ask).toEqual({
      kind: 'offer',
      remaining: 1,
    })
    expect(publisherActions({ ...WAITING, questionsAsked: 3 }).ask).toBeNull()
  })

  it('con una pregunta esperando, ni otra pregunta ni el tope: espera que conteste', () => {
    expect(publisherActions({ ...WAITING, questionsAsked: 1, questionPending: true }).ask).toEqual({
      kind: 'pending',
    })
    expect(publisherActions({ ...WAITING, questionsAsked: 3, questionPending: true }).ask).toEqual({
      kind: 'pending',
    })
  })

  it('aceptada: solo dejar sin efecto', () => {
    expect(publisherActions({ ...WAITING, status: 'accepted', questionPending: true })).toEqual({
      accept: null,
      reject: false,
      ask: null,
      revoke: true,
      identityAsk: null,
    })
  })

  it.each(APPLICATION_STATUSES.filter((status) => status !== 'sent' && status !== 'accepted'))(
    '%s: nada',
    (status) => {
      expect(publisherActions({ ...WAITING, status })).toEqual({
        accept: null,
        reject: false,
        ask: null,
        revoke: false,
        identityAsk: null,
      })
    },
  )

  describe('pedirle la identidad', () => {
    it('esperando respuesta y sin la identidad aprobada: se ofrece, también sin teléfonos ni preguntas', () => {
      expect(
        publisherActions({
          ...WAITING,
          applicantHasPhone: false,
          publisherHasPhone: false,
          questionsAsked: 3,
          questionPending: true,
        }).identityAsk,
      ).toBe('offer')
    })

    it('con la identidad aprobada o con un pedido hecho: no se ofrece', () => {
      expect(
        publisherActions({ ...WAITING, applicantIdentityVerified: true }).identityAsk,
      ).toBeNull()
      expect(
        publisherActions({
          ...WAITING,
          identityAsk: { askedAt: '2026-10-29T15:00:00Z', resolvedAt: null },
        }).identityAsk,
      ).toBeNull()
    })

    it('no cambia aceptar ni preguntar', () => {
      const offered = publisherActions(WAITING)
      const hidden = publisherActions({ ...WAITING, applicantIdentityVerified: true })
      expect({ ...offered, identityAsk: null }).toEqual(hidden)
    })
  })
})
