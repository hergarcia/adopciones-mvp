// Covers: FR-090, FR-091, SC-006 (los eventos de la historia #63, sin datos de la persona)
import { describe, expect, it } from 'vitest'
import {
  applicationAbandonedEvent,
  applicationSentEvent,
  applicationStartedEvent,
  applicationWithdrawnEvent,
  applyStoppedEvent,
  applyTappedEvent,
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
    expect(applyTappedEvent({ ...IDENTITY, signedIn: true, level: 2, required: 1 })).toEqual({
      name: 'apply_tapped',
      props: { signedIn: true, level: 2, required: 1 },
    })
    expect(applyTappedEvent({ ...IDENTITY, signedIn: false, level: 0, required: 2 })).toEqual({
      name: 'apply_tapped',
      props: { signedIn: false, level: 0, required: 2 },
    })
  })
})

describe('applyStoppedEvent', () => {
  it('cada pantalla que frena, con qué faltaba', () => {
    expect(applyStoppedEvent('needs_phone')).toEqual({
      name: 'apply_stopped',
      props: { by: 'phone' },
    })
    expect(applyStoppedEvent('needs_identity')).toEqual({
      name: 'apply_stopped',
      props: { by: 'identity' },
    })
    expect(applyStoppedEvent('limit')).toEqual({ name: 'apply_stopped', props: { by: 'limit' } })
    expect(applyStoppedEvent('not_receiving')).toEqual({
      name: 'apply_stopped',
      props: { by: 'not_receiving' },
    })
    expect(applyStoppedEvent('unavailable')).toEqual({
      name: 'apply_stopped',
      props: { by: 'not_receiving' },
    })
  })

  it('el cuestionario y las que redirigen no son un freno', () => {
    for (const gate of ['form', 'own', 'blocked_publisher', 'has_active'] as const) {
      expect(applyStoppedEvent(gate)).toBeNull()
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
        { ...IDENTITY, startedAt: NOW - 125_400, proposedUsed: true, after: 'phone' },
        NOW,
      ),
    ).toEqual({
      name: 'application_sent',
      props: { seconds: 125, proposedUsed: true, after: 'phone' },
    })
    expect(
      applicationSentEvent({ startedAt: NOW - 1_600, proposedUsed: false, after: null }, NOW),
    ).toEqual({ name: 'application_sent', props: { seconds: 2, proposedUsed: false, after: null } })
  })

  it('sin comienzo anotado, o con un reloj que fue para atrás, cero', () => {
    expect(
      applicationSentEvent({ startedAt: null, proposedUsed: false, after: null }, NOW).props,
    ).toEqual({ seconds: 0, proposedUsed: false, after: null })
    expect(
      applicationSentEvent({ startedAt: NOW + 5_000, proposedUsed: false, after: null }, NOW).props,
    ).toEqual({ seconds: 0, proposedUsed: false, after: null })
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
