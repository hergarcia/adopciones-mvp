// Covers: FR-009, FR-009a, US1-AS4, US1-AS12 (data-model.md, research R5)
import { describe, expect, it } from 'vitest'
import type { ApiPage } from './listing-requests'
import {
  profilePetsApiHref,
  profilePetsInitial,
  profilePetsMoreHref,
  profilePetsReducer,
  type ProfilePetsState,
} from './profile-pets-state'
import type { ListedCardView } from './types'

const card = (key: string): ListedCardView => ({
  key,
  href: `/animales/${key}`,
  name: key,
  zoneText: 'Pocitos, Montevideo',
  urgentText: null,
  alt: key,
  photo: { src: `https://x/${key}.webp`, placeholder: null, width: 4, height: 5 },
})

const page = (keys: string[], next: string | null): ApiPage => ({
  cards: keys.map(card),
  next,
  signedAt: '2026-10-29T12:00:00.000Z',
})

const keys = (state: ProfilePetsState) => state.cards.map((one) => one.key)

const WITH_CARDS = profilePetsInitial(page(['a', 'b'], 'cursor-b'))
const FAILED_OPEN = profilePetsInitial(null)

describe('profilePetsInitial', () => {
  it('con la primera tanda: sus tarjetas y su cursor, sin falla', () => {
    expect(WITH_CARDS).toEqual({
      cards: [card('a'), card('b')],
      next: 'cursor-b',
      pending: 'none',
      failure: null,
      request: 0,
    })
  })

  it('sin tanda: la falla al abrir, sin tarjetas ni cursor', () => {
    expect(FAILED_OPEN).toEqual({
      cards: [],
      next: null,
      pending: 'none',
      failure: { on: 'open', reason: 'no_response' },
      request: 0,
    })
  })
})

describe('profilePetsReducer', () => {
  it('«Probar de nuevo» arranca solo con la falla al abrir', () => {
    expect(profilePetsReducer(FAILED_OPEN, { type: 'retry_started' })).toEqual({
      ...FAILED_OPEN,
      pending: 'retry',
    })
    expect(profilePetsReducer(WITH_CARDS, { type: 'retry_started' })).toBe(WITH_CARDS)
    const failedMore: ProfilePetsState = {
      ...WITH_CARDS,
      failure: { on: 'more', reason: 'offline' },
    }
    expect(profilePetsReducer(failedMore, { type: 'retry_started' })).toBe(failedMore)
  })

  it('«Ver más» arranca solo con cursor', () => {
    expect(profilePetsReducer(WITH_CARDS, { type: 'more_started' })).toEqual({
      ...WITH_CARDS,
      pending: 'more',
    })
    const last = { ...WITH_CARDS, next: null }
    expect(profilePetsReducer(last, { type: 'more_started' })).toBe(last)
  })

  it('lo que trae «Probar de nuevo» reemplaza tarjetas y cursor y limpia la falla', () => {
    const retrying = profilePetsReducer(
      { ...FAILED_OPEN, cards: [card('vieja')] },
      { type: 'retry_started' },
    )
    const loaded = profilePetsReducer(retrying, { type: 'loaded', page: page(['c'], 'cursor-c') })

    expect(loaded).toEqual({
      cards: [card('c')],
      next: 'cursor-c',
      pending: 'none',
      failure: null,
      request: 0,
    })
  })

  it('«Probar de nuevo» que trae cero deja la sección sin tarjetas y sin falla', () => {
    const retrying = profilePetsReducer(FAILED_OPEN, { type: 'retry_started' })
    const loaded = profilePetsReducer(retrying, { type: 'loaded', page: page([], null) })

    expect(loaded.cards).toEqual([])
    expect(loaded.failure).toBeNull()
    expect(loaded.pending).toBe('none')
  })

  it('lo que trae «Ver más» se suma y toma el cursor nuevo', () => {
    const more = profilePetsReducer(
      { ...WITH_CARDS, failure: { on: 'more', reason: 'offline' } },
      { type: 'more_started' },
    )
    const loaded = profilePetsReducer(more, { type: 'loaded', page: page(['c'], null) })

    expect(keys(loaded)).toEqual(['a', 'b', 'c'])
    expect(loaded.next).toBeNull()
    expect(loaded.failure).toBeNull()
    expect(loaded.pending).toBe('none')
  })

  it('una falla de «Ver más» deja las tarjetas, guarda el motivo y sube el pedido', () => {
    const more = profilePetsReducer(WITH_CARDS, { type: 'more_started' })

    expect(profilePetsReducer(more, { type: 'failed', reason: 'offline' })).toEqual({
      ...WITH_CARDS,
      pending: 'none',
      failure: { on: 'more', reason: 'offline' },
      request: 1,
    })
  })

  it('una falla de «Probar de nuevo» sigue siendo la del abrir, con el motivo nuevo', () => {
    const retrying = profilePetsReducer(FAILED_OPEN, { type: 'retry_started' })

    expect(profilePetsReducer(retrying, { type: 'failed', reason: 'offline' })).toEqual({
      ...FAILED_OPEN,
      failure: { on: 'open', reason: 'offline' },
      request: 1,
    })
  })

  it('sin nada pendiente, lo que llega no cambia nada', () => {
    expect(profilePetsReducer(WITH_CARDS, { type: 'failed', reason: 'offline' })).toBe(WITH_CARDS)
    expect(profilePetsReducer(WITH_CARDS, { type: 'loaded', page: page(['z'], null) })).toBe(
      WITH_CARDS,
    )
  })
})

describe('las direcciones de la sección', () => {
  const ID = 'AbCdEfGhIjKlMnOpQrStUv'

  it('las tandas: sin cursor la primera; con cursor, codificado', () => {
    expect(profilePetsApiHref(ID, null)).toBe(`/api/perfil/${ID}/animales`)
    expect(profilePetsApiHref(ID, '2026-10-29T12:00:00+00:00~abc')).toBe(
      `/api/perfil/${ID}/animales?despues=2026-10-29T12%3A00%3A00%2B00%3A00~abc`,
    )
  })

  it('«Ver más» sin JavaScript: cuántos mostrar y el ancla al primero nuevo', () => {
    expect(profilePetsMoreHref(ID, 48, 25)).toBe(`/perfil/${ID}?mostrar=48#a-25`)
  })
})
