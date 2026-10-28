// Covers: FR-090, FR-091, SC-006 (los eventos de la historia #63, sin datos de la persona)
import { describe, expect, it } from 'vitest'
import {
  applicationAbandonedEvent,
  applicationClosedEvents,
  applicationSentEvent,
  applicationStartedEvent,
  applicationWithdrawnEvent,
  applyStoppedEvent,
  applyTappedEvent,
  applicationAcceptedEvents,
  applicationRejectedEvents,
  acceptanceRevokedEvent,
  applicationOpenedEvent,
  firstResponseEvent,
  hoursSince,
  inProcessFromOfferEvent,
  inboxOpenedEvent,
  questionAnsweredEvent,
  questionAskedEvents,
  whatsappTappedEvent,
} from './application-events'

// Lo que podría venir pegado a la entrada y no tiene que salir nunca.
const IDENTITY = {
  id: '7b0c4a1e-2f3d-4c5b-8a9e-0f1e2d3c4b5a',
  code: 'semana0001',
  userId: '1b0c4a1e-2f3d-4c5b-8a9e-0f1e2d3c4b5a',
  name: 'Tobi',
  email: 'dani@example.test',
  answers: { why_this_pet: 'Porque es tranquilo' },
}

describe('applyTappedEvent', () => {
  it('con sesión o sin ella, su nivel y el que pide el animal, y nada más', () => {
    expect(
      applyTappedEvent({ ...IDENTITY, signedIn: true, level: 2, required: 1, litter: false }),
    ).toEqual({
      name: 'apply_tapped',
      props: { signedIn: true, level: 2, required: 1, litter: false },
    })
    expect(
      applyTappedEvent({ ...IDENTITY, signedIn: false, level: 0, required: 2, litter: true }),
    ).toEqual({
      name: 'apply_tapped',
      props: { signedIn: false, level: 0, required: 2, litter: true },
    })
  })
})

describe('applyStoppedEvent', () => {
  it('cada pantalla que frena, con qué faltaba', () => {
    expect(applyStoppedEvent('needs_phone', false)).toEqual({
      name: 'apply_stopped',
      props: { by: 'phone', litter: false },
    })
    expect(applyStoppedEvent('needs_identity', false)).toEqual({
      name: 'apply_stopped',
      props: { by: 'identity', litter: false },
    })
    expect(applyStoppedEvent('limit', false)).toEqual({
      name: 'apply_stopped',
      props: { by: 'limit', litter: false },
    })
    expect(applyStoppedEvent('not_receiving', false)).toEqual({
      name: 'apply_stopped',
      props: { by: 'not_receiving', litter: false },
    })
    expect(applyStoppedEvent('unavailable', false)).toEqual({
      name: 'apply_stopped',
      props: { by: 'not_receiving', litter: false },
    })
  })

  // Covers: FR-050 de la #205
  it('una cría de una camada lo dice', () => {
    expect(applyStoppedEvent('limit', true)).toEqual({
      name: 'apply_stopped',
      props: { by: 'limit', litter: true },
    })
  })

  it('el cuestionario y las que redirigen no son un freno', () => {
    for (const gate of ['form', 'own', 'blocked_publisher', 'has_active'] as const) {
      expect(applyStoppedEvent(gate, true)).toBeNull()
    }
  })
})

describe('applicationStartedEvent', () => {
  it('si arrancó con respuestas propuestas, sin nada de la persona', () => {
    expect(applicationStartedEvent({ ...IDENTITY, proposed: true })).toEqual({
      name: 'application_started',
      props: { proposed: true },
    })
  })
})

describe('applicationAbandonedEvent', () => {
  it('la última pregunta contestada, si es una del cuestionario', () => {
    expect(applicationAbandonedEvent({ ...IDENTITY, lastQuestion: 'hours_alone' })).toEqual({
      name: 'application_abandoned',
      props: { lastQuestion: 'hours_alone' },
    })
  })

  it('cualquier otra cosa es «ninguna»', () => {
    for (const body of [{ lastQuestion: 'Porque sí' }, {}, null, 'hours_alone', 7]) {
      expect(applicationAbandonedEvent(body)).toEqual({
        name: 'application_abandoned',
        props: { lastQuestion: 'none' },
      })
    }
  })
})

describe('applicationSentEvent', () => {
  const NOW = 1_000_000

  it('los segundos redondeados desde la primera respuesta, si usó propuestas y después de qué', () => {
    expect(
      applicationSentEvent(
        { ...IDENTITY, startedAt: NOW - 125_400, proposedUsed: true, after: 'phone', litter: true },
        NOW,
      ),
    ).toEqual({
      name: 'application_sent',
      props: { seconds: 125, proposedUsed: true, after: 'phone', litter: true },
    })
    expect(
      applicationSentEvent(
        { startedAt: NOW - 1_600, proposedUsed: false, after: null, litter: false },
        NOW,
      ),
    ).toEqual({
      name: 'application_sent',
      props: { seconds: 2, proposedUsed: false, after: null, litter: false },
    })
  })

  it('sin comienzo anotado, o con un reloj que fue para atrás, cero', () => {
    expect(
      applicationSentEvent(
        { startedAt: null, proposedUsed: false, after: null, litter: false },
        NOW,
      ).props,
    ).toEqual({ seconds: 0, proposedUsed: false, after: null, litter: false })
    expect(
      applicationSentEvent(
        { startedAt: NOW + 5_000, proposedUsed: false, after: null, litter: false },
        NOW,
      ).props,
    ).toEqual({ seconds: 0, proposedUsed: false, after: null, litter: false })
  })
})

describe('applicationWithdrawnEvent', () => {
  // Covers: FR-090 (solicitud retirada, días después de mandarla)
  it('los días de calendario de Uruguay desde que la mandó, y nada más', () => {
    const sent = new Date('2026-10-06T12:00:00-03:00')
    expect(applicationWithdrawnEvent(sent, new Date('2026-10-06T23:59:00-03:00'))).toEqual({
      name: 'application_withdrawn',
      props: { days: 0 },
    })
    expect(applicationWithdrawnEvent(sent, new Date('2026-10-09T00:10:00-03:00'))).toEqual({
      name: 'application_withdrawn',
      props: { days: 3 },
    })
  })
})

describe('applicationClosedEvents', () => {
  // Covers: R11, FR-091
  it('uno por solicitud cerrada, con su motivo y nada más, en el orden en que llegan', () => {
    expect(applicationClosedEvents(['adopted', 'unpublished', 'adopted'])).toEqual([
      { name: 'application_closed', props: { reason: 'adopted' } },
      { name: 'application_closed', props: { reason: 'unpublished' } },
      { name: 'application_closed', props: { reason: 'adopted' } },
    ])
    expect(
      applicationClosedEvents(['not_receiving', 'you_blocked', 'suspended']).map(
        (event) => event.props,
      ),
    ).toEqual([{ reason: 'not_receiving' }, { reason: 'you_blocked' }, { reason: 'suspended' }])
  })

  it('sin cerradas, ningún evento; lo que no es un motivo no sale', () => {
    expect(applicationClosedEvents([])).toEqual([])
    expect(applicationClosedEvents([null, 'sent', IDENTITY.id, IDENTITY])).toEqual([])
  })
})

// Covers: FR-090, FR-091, SC-007 (los eventos de la historia #65 que usa US1)
describe('los eventos de responder', () => {
  const sentAt = new Date('2026-10-03T12:00:00Z')

  it('horas enteras redondeadas, nunca negativas', () => {
    expect(hoursSince(sentAt, new Date('2026-10-03T12:29:59Z'))).toBe(0)
    expect(hoursSince(sentAt, new Date('2026-10-03T12:30:00Z'))).toBe(1)
    expect(hoursSince(sentAt, new Date('2026-10-04T14:00:00Z'))).toBe(26)
    expect(hoursSince(sentAt, new Date('2026-10-03T10:00:00Z'))).toBe(0)
  })

  it('abrir la bandeja, sin nada más', () => {
    expect(inboxOpenedEvent()).toEqual({ name: 'inbox_opened' })
  })

  it('abrir una solicitud, con las horas desde que llegó', () => {
    expect(applicationOpenedEvent(sentAt, new Date('2026-10-03T15:00:00Z'))).toEqual({
      name: 'application_opened',
      props: { hours: 3 },
    })
  })

  // Sin medida: la de quien solicitó no se pudo leer y el momento sale sin ella (#236, FR-018).
  const unread = { ...IDENTITY, applicant: null }

  it('aceptar: «aceptada» y, si fue la primera respuesta, cuánto tardó', () => {
    const now = new Date('2026-10-05T12:00:00Z')
    expect(
      applicationAcceptedEvents({ ...unread, firstResponse: true, sentAt, inLitter: false }, now),
    ).toStrictEqual([
      { name: 'application_accepted', props: { litter: false } },
      { name: 'application_first_response', props: { hours: 48, kind: 'accept' } },
    ])
    // Covers: FR-041 de #206 (la aceptación de una cría lleva la marca de camada)
    expect(
      applicationAcceptedEvents({ ...unread, firstResponse: false, sentAt, inLitter: true }, now),
    ).toStrictEqual([{ name: 'application_accepted', props: { litter: true } }])
  })

  // Covers: US2-AS1, US2-AS5 (el motivo, nunca la línea de «otro»)
  it('rechazar: el motivo y, si fue la primera respuesta, cuánto tardó', () => {
    const now = new Date('2026-10-04T12:00:00Z')
    const note = { ...unread, note: 'Vive en un monoambiente' }
    expect(
      applicationRejectedEvents({ ...note, reason: 'other', firstResponse: true, sentAt }, now),
    ).toStrictEqual([
      { name: 'application_rejected', props: { reason: 'other' } },
      { name: 'application_first_response', props: { hours: 24, kind: 'reject' } },
    ])
    expect(
      applicationRejectedEvents({ ...note, reason: 'housing', firstResponse: false, sentAt }, now),
    ).toStrictEqual([{ name: 'application_rejected', props: { reason: 'housing' } }])
  })

  it('dejar sin efecto: el motivo y nada más', () => {
    expect(acceptanceRevokedEvent('not_concluded', null)).toStrictEqual({
      name: 'acceptance_revoked',
      props: { reason: 'not_concluded' },
    })
  })

  // Covers: US3-AS1 (preguntar y contestar, sin el texto)
  it('preguntar: la pregunta y, si fue la primera respuesta, cuánto tardó', () => {
    const now = new Date('2026-10-03T18:00:00Z')
    const text = { ...unread, text: '¿El balcón tiene red?' }
    expect(questionAskedEvents({ ...text, firstResponse: true, sentAt }, now)).toStrictEqual([
      { name: 'question_asked', props: {} },
      { name: 'application_first_response', props: { hours: 6, kind: 'ask' } },
    ])
    expect(questionAskedEvents({ ...text, firstResponse: false, sentAt }, now)).toStrictEqual([
      { name: 'question_asked', props: {} },
    ])
  })

  it('contestar: las horas desde que se la hicieron, y nada más', () => {
    expect(questionAnsweredEvent(sentAt, new Date('2026-10-04T15:00:00Z'))).toEqual({
      name: 'question_answered',
      props: { hours: 27 },
    })
  })

  it('la primera respuesta de cada tipo', () => {
    expect(
      firstResponseEvent('reject', { sentAt, applicant: null }, new Date('2026-10-03T13:00:00Z')),
    ).toStrictEqual({
      name: 'application_first_response',
      props: { hours: 1, kind: 'reject' },
    })
  })

  it('«Abrir WhatsApp» con la punta, y «En proceso» desde la oferta, sin ids ni teléfonos', () => {
    expect(whatsappTappedEvent('publisher')).toEqual({
      name: 'whatsapp_tapped',
      props: { side: 'publisher' },
    })
    expect(whatsappTappedEvent('applicant')).toEqual({
      name: 'whatsapp_tapped',
      props: { side: 'applicant' },
    })
    expect(inProcessFromOfferEvent()).toEqual({ name: 'pet_in_process_from_offer' })
  })
})

// Covers: US1-AS1, US1-AS2, US1-AS3, US1-AS4, US1-AS8, US1-AS11, FR-001 a FR-005, FR-020 (#236)
describe('responder con la medida de quien solicitó', () => {
  const sentAt = new Date('2026-10-03T12:00:00Z')
  const now = new Date('2026-10-04T12:00:00Z')
  const bruno = { ...IDENTITY, applicant: { level: 2, followUp: false } } as const
  const ana = { ...IDENTITY, applicant: { level: 3, followUp: true } } as const

  it('aceptar: el momento y su primera respuesta llevan el mismo nivel y el mismo sí o no', () => {
    expect(
      applicationAcceptedEvents({ ...bruno, firstResponse: true, sentAt, inLitter: false }, now),
    ).toStrictEqual([
      {
        name: 'application_accepted',
        props: { litter: false, applicant_level: 2, applicant_follow_up: false },
      },
      {
        name: 'application_first_response',
        props: { hours: 24, kind: 'accept', applicant_level: 2, applicant_follow_up: false },
      },
    ])
  })

  it('aceptar una cría: el nivel junto a la marca de camada', () => {
    expect(
      applicationAcceptedEvents({ ...ana, firstResponse: false, sentAt, inLitter: true }, now),
    ).toStrictEqual([
      {
        name: 'application_accepted',
        props: { litter: true, applicant_level: 3, applicant_follow_up: true },
      },
    ])
  })

  it('rechazar: el motivo que ya llevaba, el nivel y el sí o no, también en la primera respuesta', () => {
    expect(
      applicationRejectedEvents({ ...ana, reason: 'housing', firstResponse: true, sentAt }, now),
    ).toStrictEqual([
      {
        name: 'application_rejected',
        props: { reason: 'housing', applicant_level: 3, applicant_follow_up: true },
      },
      {
        name: 'application_first_response',
        props: { hours: 24, kind: 'reject', applicant_level: 3, applicant_follow_up: true },
      },
    ])
  })

  it('preguntar: el nivel y el sí o no, también en la primera respuesta', () => {
    const diego = { ...IDENTITY, applicant: { level: 1, followUp: false } } as const
    expect(questionAskedEvents({ ...diego, firstResponse: true, sentAt }, now)).toStrictEqual([
      { name: 'question_asked', props: { applicant_level: 1, applicant_follow_up: false } },
      {
        name: 'application_first_response',
        props: { hours: 24, kind: 'ask', applicant_level: 1, applicant_follow_up: false },
      },
    ])
  })

  it('quien no tiene el teléfono verificado se mide con 0, que no es «sin nivel»', () => {
    const lost = { ...IDENTITY, applicant: { level: 0, followUp: false } } as const
    expect(questionAskedEvents({ ...lost, firstResponse: false, sentAt }, now)).toStrictEqual([
      { name: 'question_asked', props: { applicant_level: 0, applicant_follow_up: false } },
    ])
  })

  it('dejar sin efecto: el motivo que ya llevaba, el nivel y el sí o no', () => {
    expect(acceptanceRevokedEvent('not_concluded', { level: 2, followUp: true })).toStrictEqual({
      name: 'acceptance_revoked',
      props: { reason: 'not_concluded', applicant_level: 2, applicant_follow_up: true },
    })
  })
})
