// Covers: FR-080, FR-081 (los eventos de Administrar, en horas enteras y sin datos de nadie)
import { describe, expect, it } from 'vitest'
import {
  adminOpenedEvent,
  digestSentEvent,
  queueOverdueEvent,
  recordOpenedEvent,
  searchDoneEvent,
} from './admin-events'

const HOUR = 3_600_000
const NOW = new Date('2026-10-09T11:00:00.000Z')
const ago = (ms: number) => new Date(NOW.getTime() - ms)

describe('adminOpenedEvent', () => {
  it('lleva solo desde dónde', () => {
    expect(adminOpenedEvent('digest')).toEqual({ name: 'admin_opened', props: { from: 'digest' } })
  })
})

describe('queueOverdueEvent', () => {
  it('la cola y las horas enteras que se pasó', () => {
    expect(queueOverdueEvent('pets', 5 * HOUR - 1)).toEqual({
      name: 'admin_queue_overdue',
      props: { queue: 'pets', hours_over: 4 },
    })
  })
})

describe('digestSentEvent', () => {
  it('cuántos y las horas enteras del más viejo de cada cola, y cuáles atrasadas, sin quién', () => {
    const event = digestSentEvent(
      {
        userId: '1b0c4a1e-2f3d-4c5b-8a9e-0f1e2d3c4b5a',
        identity: { count: 3, oldest: ago(72 * HOUR + 30 * 60_000) },
        pets: { count: 1, oldest: ago(5 * HOUR) },
        reports: { count: 2, oldest: ago(49 * HOUR) },
      },
      NOW,
    )
    expect(event).toEqual({
      name: 'admin_digest_sent',
      props: {
        identity_count: 3,
        identity_hours: 72,
        pets_count: 1,
        pets_hours: 5,
        reports_count: 2,
        reports_hours: 49,
        overdue: ['identity', 'reports'],
      },
    })
    expect(JSON.stringify(event)).not.toContain('1b0c4a1e')
  })

  it('una cola sin pendientes cuenta 0 horas; el reloj adelantado de la base no da horas negativas', () => {
    expect(
      digestSentEvent(
        {
          userId: 'x',
          identity: { count: 0, oldest: null },
          pets: { count: 1, oldest: new Date(NOW.getTime() + 2 * HOUR) },
          reports: { count: 0, oldest: null },
        },
        NOW,
      ).props,
    ).toEqual({
      identity_count: 0,
      identity_hours: 0,
      pets_count: 1,
      pets_hours: 0,
      reports_count: 0,
      reports_hours: 0,
      overdue: [],
    })
  })
})

describe('recordOpenedEvent', () => {
  it('lleva solo desde dónde', () => {
    expect(recordOpenedEvent('search')).toEqual({
      name: 'admin_record_opened',
      props: { from: 'search' },
    })
  })
})

describe('searchDoneEvent', () => {
  it('si encontró a alguien, nunca lo escrito', () => {
    expect(searchDoneEvent(true)).toEqual({ name: 'admin_search_done', props: { found: true } })
    expect(searchDoneEvent(false)).toEqual({ name: 'admin_search_done', props: { found: false } })
  })
})
