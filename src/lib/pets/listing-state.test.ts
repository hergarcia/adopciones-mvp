// Covers: FR-015, FR-016, FR-017a, FR-018, US3-AS6, US3-AS9 y Pantallas «Cambios seguidos» (research R4, R11)
import { describe, expect, it } from 'vitest'
import { NO_FILTERS, type ListingFilters } from './listing-query'
import type { ApiPage } from './listing-requests'
import {
  canLoadMore,
  filtersToReload,
  isStale,
  listingReducer,
  restoreDecision,
  type ListingSnapshot,
  type ListingState,
} from './listing-state'
import type { ListedCardView } from './types'

const SIGNED = '2026-09-28T12:00:00.000Z'
const after = (minutes: number) => new Date(Date.parse(SIGNED) + minutes * 60_000)

describe('isStale', () => {
  it('49 minutos no; 50 y 51, sí', () => {
    expect(isStale(SIGNED, after(49))).toBe(false)
    expect(isStale(SIGNED, after(49.99))).toBe(false)
    expect(isStale(SIGNED, after(50))).toBe(true)
    expect(isStale(SIGNED, after(51))).toBe(true)
  })
})

const card = (key: string): ListedCardView => ({
  key,
  href: `/animales/${key}`,
  name: key,
  zoneText: 'Pocitos, Montevideo',
  urgentText: null,
  alt: key,
  photo: { src: `https://x/${key}.webp`, placeholder: null, width: 4, height: 5 },
})

const STATE: ListingState = {
  cards: [card('a'), card('b')],
  next: 'cursor-b',
  total: 30,
  totalText: '30 animales',
  signedAt: SIGNED,
  filters: NO_FILTERS,
  pending: 'none',
  request: 1,
  failure: null,
}

const cats = { ...NO_FILTERS, species: ['cat' as const] }
const page = (keys: string[], extra: Partial<ApiPage> = {}): ApiPage => ({
  cards: keys.map(card),
  next: null,
  signedAt: '2026-09-28T12:30:00.000Z',
  ...extra,
})

describe('listingReducer', () => {
  it('un filtro marca, espera, y al llegar reemplaza las cards y el total', () => {
    const waiting = listingReducer(STATE, { type: 'filter', filters: cats, request: 2 })
    expect(waiting).toEqual({ ...STATE, filters: cats, pending: 'filter', request: 2 })
    const done = listingReducer(waiting, {
      type: 'loaded',
      request: 2,
      page: page(['c'], { next: 'cursor-c', total: 5, totalText: '5 animales' }),
    })
    expect(done).toEqual({
      ...waiting,
      pending: 'none',
      cards: [card('c')],
      next: 'cursor-c',
      total: 5,
      totalText: '5 animales',
      signedAt: '2026-09-28T12:30:00.000Z',
    })
  })

  it('«Ver más» agrega sin tocar el total, y guarda la firma más vieja', () => {
    const waiting = listingReducer(STATE, { type: 'more', request: 2 })
    expect(waiting).toEqual({ ...STATE, pending: 'more', request: 2 })
    const done = listingReducer(waiting, { type: 'loaded', request: 2, page: page(['c', 'd']) })
    expect(done.cards.map((one) => one.key)).toEqual(['a', 'b', 'c', 'd'])
    expect(done).toMatchObject({ total: 30, totalText: '30 animales', next: null, pending: 'none' })
    expect(done.signedAt).toBe(SIGNED)
    const newer = { ...waiting, signedAt: '2026-09-28T13:00:00.000Z' }
    expect(listingReducer(newer, { type: 'loaded', request: 2, page: page(['c']) }).signedAt).toBe(
      '2026-09-28T12:30:00.000Z',
    )
  })

  it('renovar las fotos reemplaza las cards con la firma nueva y no toca el total', () => {
    const waiting = listingReducer(STATE, { type: 'refresh', request: 2 })
    expect(waiting).toEqual({ ...STATE, pending: 'refresh', request: 2 })
    const done = listingReducer(waiting, { type: 'loaded', request: 2, page: page(['a', 'b']) })
    expect(done).toMatchObject({ total: 30, signedAt: '2026-09-28T12:30:00.000Z', pending: 'none' })
  })

  it('lo que llega de un pedido viejo no cambia nada', () => {
    const waiting = listingReducer(STATE, { type: 'filter', filters: cats, request: 3 })
    expect(listingReducer(waiting, { type: 'loaded', request: 2, page: page(['x']) })).toBe(waiting)
    expect(listingReducer(waiting, { type: 'failed', request: 2, reason: 'offline' })).toBe(waiting)
  })

  it('una falla de «Ver más» deja las cards con su motivo', () => {
    const waiting = listingReducer(STATE, { type: 'more', request: 2 })
    expect(listingReducer(waiting, { type: 'failed', request: 2, reason: 'offline' })).toEqual({
      ...waiting,
      pending: 'none',
      failure: { on: 'more', reason: 'offline' },
    })
  })

  it('una falla de un filtro deja las cards de antes, marcadas como de los filtros anteriores', () => {
    const waiting = listingReducer(STATE, { type: 'filter', filters: cats, request: 2 })
    expect(listingReducer(waiting, { type: 'failed', request: 2, reason: 'no_response' })).toEqual({
      ...waiting,
      pending: 'none',
      failure: { on: 'filter', reason: 'no_response' },
    })
  })

  it('sin cards, una falla es la de abrir el listado', () => {
    const empty = { ...STATE, cards: [], request: 2, pending: 'filter' as const }
    expect(
      listingReducer(empty, { type: 'failed', request: 2, reason: 'offline' }).failure,
    ).toEqual({ on: 'open', reason: 'offline' })
  })

  it('una falla al renovar las fotos no dice nada', () => {
    const waiting = listingReducer(STATE, { type: 'refresh', request: 2 })
    expect(listingReducer(waiting, { type: 'failed', request: 2, reason: 'offline' })).toEqual({
      ...waiting,
      pending: 'none',
    })
  })

  it('una respuesta que llega limpia la falla anterior', () => {
    const failed = { ...STATE, failure: { on: 'more' as const, reason: 'offline' as const } }
    const waiting = listingReducer(failed, { type: 'more', request: 2 })
    expect(
      listingReducer(waiting, { type: 'loaded', request: 2, page: page([]) }).failure,
    ).toBeNull()
  })

  it('reponer desde la pestaña deja lo que se había cargado', () => {
    const view = {
      cards: [card('z')],
      next: 'cursor-z',
      total: 9,
      totalText: '9 animales',
      signedAt: '2026-09-28T12:10:00.000Z',
    }
    const busy = {
      ...STATE,
      pending: 'more' as const,
      failure: { on: 'more' as const, reason: 'offline' as const },
    }
    expect(listingReducer(busy, { type: 'restored', view, filters: cats })).toEqual({
      ...STATE,
      ...view,
      filters: cats,
      pending: 'none',
      failure: null,
    })
  })
})

describe('canLoadMore', () => {
  it('con otra tanda y lo que se ve al día, sí; también mientras suma o renueva', () => {
    expect(canLoadMore(STATE)).toBe(true)
    expect(canLoadMore({ ...STATE, pending: 'more' })).toBe(true)
    expect(canLoadMore({ ...STATE, pending: 'refresh' })).toBe(true)
    expect(canLoadMore({ ...STATE, failure: { on: 'more', reason: 'offline' } })).toBe(true)
  })

  it('sin otra tanda, no', () => {
    expect(canLoadMore({ ...STATE, next: null })).toBe(false)
  })

  it('mientras llega un filtro, o si falló, no: el cursor es de los filtros anteriores', () => {
    const waiting = listingReducer(STATE, { type: 'filter', filters: cats, request: 2 })
    expect(canLoadMore(waiting)).toBe(false)
    const failed = listingReducer(waiting, { type: 'failed', request: 2, reason: 'offline' })
    expect(canLoadMore(failed)).toBe(false)
  })
})

const SNAPSHOT: ListingSnapshot = {
  cards: [card('a')],
  next: null,
  total: 1,
  totalText: '1 animal',
  signedAt: SIGNED,
  href: '/animales?especie=gato',
  returning: true,
  scrollY: 800,
}

describe('restoreDecision', () => {
  it('repone con «vuelvo», la misma dirección y las fotos vigentes', () => {
    expect(restoreDecision(SNAPSHOT, '/animales?especie=gato', after(10))).toBe(SNAPSHOT)
  })

  it('no repone sin foto, sin «vuelvo», en otra dirección o con las fotos por vencer', () => {
    expect(restoreDecision(null, '/animales', after(10))).toBeNull()
    expect(restoreDecision({ ...SNAPSHOT, returning: false }, SNAPSHOT.href, after(10))).toBeNull()
    expect(restoreDecision(SNAPSHOT, '/animales', after(10))).toBeNull()
    expect(restoreDecision(SNAPSHOT, SNAPSHOT.href, after(50))).toBeNull()
  })
})

describe('filtersToReload', () => {
  const filters = (partial: Partial<ListingFilters>): ListingFilters => ({
    ...NO_FILTERS,
    ...partial,
  })

  it('con los mismos filtros en la dirección no hay nada que pedir', () => {
    expect(filtersToReload(filters({ species: ['cat'] }), '?especie=gato&mostrar=48')).toBeNull()
  })

  it('todas las opciones marcadas buscan lo mismo que ninguna', () => {
    expect(filtersToReload(NO_FILTERS, '?especie=perro,gato')).toBeNull()
  })

  it('con otros filtros en la dirección, pide esos, como están marcados y con cuántas se veían', () => {
    expect(filtersToReload(NO_FILTERS, '?especie=perro,gato&edad=joven&mostrar=48')).toEqual({
      filters: filters({ species: ['dog', 'cat'], age: ['young'] }),
      shown: 48,
    })
  })

  it('sin filtros en la dirección, vuelve al listado entero de a 24', () => {
    expect(filtersToReload(filters({ age: ['senior'] }), '')).toEqual({
      filters: NO_FILTERS,
      shown: 24,
    })
  })
})
