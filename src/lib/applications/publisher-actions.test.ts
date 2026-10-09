// Covers: FR-007, FR-011, FR-031, US1-AS12, US1-AS13, US1-AS16 (qué se ofrece al publicador)
import { describe, expect, it } from 'vitest'
import { publisherActions } from './publisher-actions'
import { APPLICATION_STATUSES } from './types'

const WAITING = {
  status: 'sent' as const,
  applicantHasPhone: true,
  publisherHasPhone: true,
  questionsAsked: 0,
  questionPending: false,
}

describe('publisherActions', () => {
  it('esperando respuesta, con los dos teléfonos: aceptar, rechazar y las 3 preguntas', () => {
    expect(publisherActions(WAITING)).toEqual({
      accept: 'offer',
      reject: true,
      ask: { kind: 'offer', remaining: 3 },
      revoke: false,
    })
  })

  it('sin el teléfono de quien solicitó, aceptar frenado; rechazar y preguntar siguen', () => {
    expect(publisherActions({ ...WAITING, applicantHasPhone: false })).toEqual({
      accept: 'applicant_needs_phone',
      reject: true,
      ask: { kind: 'offer', remaining: 3 },
      revoke: false,
    })
  })

  it('sin el teléfono del publicador, el aviso de verificación va primero, aunque falten los dos', () => {
    expect(publisherActions({ ...WAITING, publisherHasPhone: false })).toEqual({
      accept: 'publisher_needs_phone',
      reject: true,
      ask: { kind: 'offer', remaining: 3 },
      revoke: false,
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
      })
    },
  )
})
