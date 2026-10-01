// Covers: FR-032, SC-008 (research R11)
import { describe, expect, it } from 'vitest'
import { daysSincePublished, deletedEvent, statusChangeEvent } from './pet-events'

// 12:00 en Uruguay.
const NOW = new Date('2026-10-10T15:00:00.000Z')

const change = {
  from: 'available',
  to: 'in_process',
  publishedAt: new Date('2026-10-01T15:00:00.000Z'),
  now: NOW,
  via: 'my_pets',
} as const

describe('daysSincePublished', () => {
  it('el mismo día de Uruguay es 0, aunque en UTC ya sea otro', () => {
    // 23:30 del 9 en Uruguay es el 10 en UTC.
    expect(daysSincePublished(new Date('2026-10-10T02:30:00.000Z'), NOW)).toBe(1)
    expect(daysSincePublished(new Date('2026-10-10T03:30:00.000Z'), NOW)).toBe(0)
  })

  it('cuenta días de calendario', () => {
    expect(daysSincePublished(change.publishedAt, NOW)).toBe(9)
  })

  it('cruza meses de distinto largo', () => {
    const fromJanuary = new Date('2026-01-31T15:00:00.000Z')
    expect(daysSincePublished(fromJanuary, new Date('2026-03-01T15:00:00.000Z'))).toBe(29)
  })

  it('una fecha en el futuro no da negativo', () => {
    expect(daysSincePublished(new Date('2026-10-12T15:00:00.000Z'), NOW)).toBe(0)
  })
})

describe('statusChangeEvent', () => {
  it('marcar en proceso: desde cuál, hacia cuál y los días desde publicada', () => {
    expect(statusChangeEvent({ ...change, action: 'mark_in_process' })).toEqual({
      name: 'pet_status_changed',
      props: { from: 'available', to: 'in_process', days_since_published: 9 },
    })
  })

  it('marcar adoptada una vencida', () => {
    expect(
      statusChangeEvent({ ...change, action: 'mark_adopted', from: 'expired', to: 'adopted' }),
    ).toEqual({
      name: 'pet_status_changed',
      props: { from: 'expired', to: 'adopted', days_since_published: 9 },
    })
  })

  it('renovar mide solo desde dónde', () => {
    expect(statusChangeEvent({ ...change, action: 'renew', via: 'email' })).toEqual({
      name: 'pet_renewed',
      props: { via: 'email' },
    })
  })

  it('volver a publicar una adoptada', () => {
    expect(
      statusChangeEvent({ ...change, action: 'republish', from: 'adopted', to: 'available' }),
    ).toEqual({ name: 'pet_republished', props: { from: 'adopted', via: 'my_pets' } })
  })

  it('volver a publicar una vencida', () => {
    expect(
      statusChangeEvent({ ...change, action: 'republish', from: 'expired', via: 'email' }),
    ).toEqual({ name: 'pet_republished', props: { from: 'expired', via: 'email' } })
  })
})

describe('deletedEvent', () => {
  it('desde qué estado se borró', () => {
    expect(deletedEvent('taken_down')).toEqual({
      name: 'pet_deleted',
      props: { from: 'taken_down' },
    })
  })
})
