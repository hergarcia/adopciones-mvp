// Covers: FR-060, FR-061 (el pedido y el no pedido, sin ids ni datos de nadie)
import { describe, expect, it } from 'vitest'
import {
  followUpAnsweredEvent,
  followUpResolvedEvent,
  followUpViewedEvent,
} from './follow-up-events'

describe('followUpResolvedEvent', () => {
  it('pedido: el evento solo, sin propiedades', () => {
    expect(followUpResolvedEvent({ status: 'requested' })).toEqual({ name: 'follow_up_requested' })
  })

  it.each(['account_deleted', 'ended', 'declined', 'blocked', 'suspended'] as const)(
    'no pedido por %s: solo el motivo',
    (reason) => {
      expect(followUpResolvedEvent({ status: 'skipped', reason })).toEqual({
        name: 'follow_up_skipped',
        props: { reason },
      })
    },
  )
})

// Covers: FR-062 (la respuesta y la primera vista: días de calendario, nada del texto ni de nadie)
describe('followUpAnsweredEvent', () => {
  it('los días de Uruguay desde el pedido, las fotos y si hay texto', () => {
    expect(
      followUpAnsweredEvent({
        requestedAt: new Date('2026-11-08T02:30:00Z'),
        photoCount: 2,
        hasText: true,
        now: new Date('2026-11-10T04:00:00Z'),
      }),
    ).toEqual({
      name: 'follow_up_answered',
      props: { days_since_requested: 3, photo_count: 2, has_text: true },
    })
  })

  it('sin texto', () => {
    const at = new Date('2026-11-08T15:00:00Z')
    expect(
      followUpAnsweredEvent({ requestedAt: at, photoCount: 1, hasText: false, now: at }),
    ).toEqual({
      name: 'follow_up_answered',
      props: { days_since_requested: 0, photo_count: 1, has_text: false },
    })
  })
})

describe('followUpViewedEvent', () => {
  it('los días de Uruguay desde que llegó la respuesta', () => {
    expect(
      followUpViewedEvent(new Date('2026-11-08T15:00:00Z'), new Date('2026-11-09T15:00:00Z')),
    ).toEqual({ name: 'follow_up_viewed', props: { days_since_answered: 1 } })
  })
})
