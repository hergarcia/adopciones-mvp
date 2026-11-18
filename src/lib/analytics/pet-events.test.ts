// Covers: FR-032, SC-008 (research R11)
import { describe, expect, it } from 'vitest'
import {
  daysSincePublished,
  deletedEvent,
  petEditedEvent,
  petPublishedEvent,
  publicationOrdinal,
  statusChangeEvent,
} from './pet-events'

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
    // Estricto: un animal suelto no lleva la marca de camada, ni vacía.
    expect(statusChangeEvent({ ...change, action: 'mark_in_process' })).toStrictEqual({
      name: 'pet_status_changed',
      props: { from: 'available', to: 'in_process', days_since_published: 9 },
    })
  })

  // Covers: R12 de la #206
  it('una cría lleva la marca de camada', () => {
    expect(statusChangeEvent({ ...change, action: 'mark_in_process', litter: 'young' })).toEqual({
      name: 'pet_status_changed',
      props: { from: 'available', to: 'in_process', days_since_published: 9, litter: 'young' },
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

  // Covers: R12 y FR-042 de la #206
  it('renovar y volver a publicar la camada entera llevan su marca', () => {
    expect(statusChangeEvent({ ...change, action: 'renew', litter: 'litter' })).toStrictEqual({
      name: 'pet_renewed',
      props: { via: 'my_pets', litter: 'litter' },
    })
    expect(
      statusChangeEvent({ ...change, action: 'republish', from: 'adopted', litter: 'litter' }),
    ).toStrictEqual({
      name: 'pet_republished',
      props: { from: 'adopted', via: 'my_pets', litter: 'litter' },
    })
    // Una cría no se renueva sola: sin la marca de camada entera.
    expect(statusChangeEvent({ ...change, action: 'renew', litter: 'young' })).toStrictEqual({
      name: 'pet_renewed',
      props: { via: 'my_pets' },
    })
  })

  it('volver a publicar una vencida', () => {
    expect(
      statusChangeEvent({ ...change, action: 'republish', from: 'expired', via: 'email' }),
    ).toEqual({ name: 'pet_republished', props: { from: 'expired', via: 'email' } })
  })
})

describe('deletedEvent', () => {
  it('desde qué estado se borró', () => {
    expect(deletedEvent('taken_down')).toStrictEqual({
      name: 'pet_deleted',
      props: { from: 'taken_down' },
    })
  })

  // Covers: R12 de la #206 (quitar una cría lleva la marca de camada)
  it('una cría quitada lleva la marca', () => {
    expect(deletedEvent('adopted', 'young')).toEqual({
      name: 'pet_deleted',
      props: { from: 'adopted', litter: 'young' },
    })
  })
})

// Covers: FR-049, SC-006 de la #205
describe('publicationOrdinal', () => {
  it('la primera, la segunda y desde la tercera, 3+', () => {
    expect(publicationOrdinal({ pets: 1, litters: 0 })).toBe('1')
    expect(publicationOrdinal({ pets: 2, litters: 0 })).toBe('2')
    expect(publicationOrdinal({ pets: 3, litters: 0 })).toBe('3+')
    expect(publicationOrdinal({ pets: 7, litters: 0 })).toBe('3+')
  })

  it('una camada suma una sola publicación', () => {
    expect(publicationOrdinal({ pets: 0, litters: 1 })).toBe('1')
    expect(publicationOrdinal({ pets: 1, litters: 1 })).toBe('2')
    expect(publicationOrdinal({ pets: 1, litters: 2 })).toBe('3+')
  })
})

// Covers: #292 US5-AS1, FR-028 (el sí o el no de la pregunta propia, nunca su texto)
describe('publicar y editar', () => {
  const QUESTION = 'Kira toma una pastilla dos veces por día. ¿Podés dársela en horario?'
  const counts = { photos: 3, seconds: 95, ordinal: '2' }

  it('un animal con pregunta: lo que ya llevaba y el sí, sin el texto', () => {
    expect(
      petPublishedEvent({ ...counts, litter: false, requiredLevel: 2, ownQuestion: QUESTION }),
    ).toStrictEqual({
      name: 'pet_published',
      props: {
        photos: 3,
        seconds: 95,
        ordinal: '2',
        litter: false,
        required_level: 2,
        own_question: true,
      },
    })
    expect(
      petEditedEvent({ litter: false, requiredLevel: 1, ownQuestion: QUESTION }),
    ).toStrictEqual({
      name: 'pet_edited',
      props: { litter: false, required_level: 1, own_question: true },
    })
  })

  it('una camada sin pregunta: sus crías y el no', () => {
    expect(
      petPublishedEvent({
        ...counts,
        litter: true,
        young: 4,
        requiredLevel: 1,
        ownQuestion: null,
      }),
    ).toStrictEqual({
      name: 'pet_published',
      props: {
        photos: 3,
        seconds: 95,
        ordinal: '2',
        litter: true,
        young: 4,
        required_level: 1,
        own_question: false,
      },
    })
    expect(
      petEditedEvent({ litter: true, young: 3, requiredLevel: 2, ownQuestion: null }),
    ).toStrictEqual({
      name: 'pet_edited',
      props: { litter: true, young: 3, required_level: 2, own_question: false },
    })
  })
})
