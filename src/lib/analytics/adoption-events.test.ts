// Covers: FR-070, FR-071, SC-007 (el evento de marcar adoptado)
import { describe, expect, it } from 'vitest'
import { adoptionDeclinedEvent, commitmentAcceptedEvent, handoverEvent } from './adoption-events'

const NOW = new Date('2026-10-08T15:00:00Z')

describe('handoverEvent', () => {
  it('a una persona: los días desde que se publicó y desde que se aceptó, y cuántas aceptadas', () => {
    expect(
      handoverEvent({
        site: true,
        publishedAt: new Date('2026-09-28T15:00:00Z'),
        acceptedAt: new Date('2026-10-05T15:00:00Z'),
        acceptedCount: 2,
        now: NOW,
      }),
    ).toEqual({
      name: 'pet_handed_over',
      props: { to: 'site', days_since_published: 10, days_since_accepted: 3, accepted_count: 2 },
    })
  })

  it('por fuera del sitio: sin días desde la aceptación', () => {
    expect(
      handoverEvent({
        site: false,
        publishedAt: new Date('2026-10-08T12:00:00Z'),
        acceptedAt: null,
        acceptedCount: 0,
        now: NOW,
      }),
    ).toEqual({
      name: 'pet_handed_over',
      props: {
        to: 'outside',
        days_since_published: 0,
        days_since_accepted: null,
        accepted_count: 0,
      },
    })
  })
})

// Covers: FR-070, FR-071 (el compromiso aceptado: solo las horas)
describe('commitmentAcceptedEvent', () => {
  it('las horas redondeadas desde que se marcó', () => {
    expect(commitmentAcceptedEvent(new Date('2026-10-07T12:00:00Z'), NOW)).toEqual({
      name: 'commitment_accepted',
      props: { hours_since_marked: 27 },
    })
  })
})

// Covers: FR-070, FR-071 («Yo no adopté»: solo las horas)
describe('adoptionDeclinedEvent', () => {
  it('las horas redondeadas desde que se marcó', () => {
    expect(adoptionDeclinedEvent(new Date('2026-10-08T10:31:00Z'), NOW)).toEqual({
      name: 'adoption_declined',
      props: { hours_since_marked: 4 },
    })
  })
})
