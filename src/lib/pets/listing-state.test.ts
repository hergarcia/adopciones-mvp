// Covers: FR-015, FR-016, FR-017a, FR-018, US3-AS6, US3-AS9 y Pantallas «Cambios seguidos» (research R4, R11)
// Covers #287: US1-AS1–AS4, FR-001, FR-004, FR-005, FR-009 y §Edge Cases (research R1, R3, R4, R5)
import { describe, expect, it } from 'vitest'
import { NO_FILTERS, type ListingFilters } from './listing-query'
import type { ApiPage } from './listing-requests'
import {
  canLoadMore,
  filtersToReload,
  isStale,
  listingReducer,
  restoreDecision,
  retryFilters,
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
  shownFilters: NO_FILTERS,
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
      shownFilters: cats,
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
    expect(done.shownFilters).toBe(STATE.filters)
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
      failure: { on: 'more', reason: 'offline', wanted: null },
    })
  })

  // La regla de #287 reemplaza a «deja las cards de antes, marcadas como de los filtros anteriores»:
  // el listado ya no dice un filtro que las cards no cumplen.
  it('una falla de un filtro vuelve a marcar los filtros de las cards a la vista', () => {
    const montevideo = { ...NO_FILTERS, department: ['UY-MO' as const] }
    const shown = { ...STATE, filters: montevideo, shownFilters: montevideo }
    const dogs = { ...montevideo, species: ['dog' as const] }
    const waiting = listingReducer(shown, { type: 'filter', filters: dogs, request: 2 })
    expect(listingReducer(waiting, { type: 'failed', request: 2, reason: 'no_response' })).toEqual({
      ...shown,
      request: 2,
      failure: { on: 'filter', reason: 'no_response', wanted: dogs },
    })
  })

  it('sacar un filtro que falla lo vuelve a marcar', () => {
    const identity = { ...NO_FILTERS, publisher: ['identity' as const] }
    const shown = { ...STATE, filters: identity, shownFilters: identity }
    const waiting = listingReducer(shown, { type: 'filter', filters: NO_FILTERS, request: 2 })
    const failed = listingReducer(waiting, { type: 'failed', request: 2, reason: 'offline' })
    expect(failed.filters).toBe(identity)
    expect(failed.failure?.wanted).toBe(NO_FILTERS)
  })

  it('con dos pedidos seguidos, la falla del último vuelve a lo que se ve y no al intermedio', () => {
    const dogs = { ...NO_FILTERS, species: ['dog' as const] }
    const first = listingReducer(STATE, { type: 'filter', filters: cats, request: 2 })
    const second = listingReducer(first, { type: 'filter', filters: dogs, request: 3 })
    const failed = listingReducer(second, { type: 'failed', request: 3, reason: 'offline' })
    expect(failed.filters).toBe(NO_FILTERS)
    expect(failed.failure).toEqual({ on: 'filter', reason: 'offline', wanted: dogs })
  })

  // Reemplaza a «sin cards, una falla es la de abrir el listado»: un vacío sí cargó.
  it('desde un vacío, la falla es la de un filtro, con los filtros del vacío', () => {
    const rivera = { ...NO_FILTERS, species: ['cat' as const], department: ['UY-RV' as const] }
    const empty = { ...STATE, cards: [], filters: rivera, shownFilters: rivera }
    const waiting = listingReducer(empty, { type: 'filter', filters: cats, request: 2 })
    const failed = listingReducer(waiting, { type: 'failed', request: 2, reason: 'offline' })
    expect(failed.failure).toEqual({ on: 'filter', reason: 'offline', wanted: cats })
    expect(failed.filters).toBe(rivera)
  })

  it('si el listado nunca cargó, otro filtro que falla sigue siendo la falla al abrir', () => {
    const linked = { ...NO_FILTERS, publisher: ['identity' as const] }
    const never = {
      ...STATE,
      cards: [],
      filters: linked,
      shownFilters: linked,
      failure: { on: 'open' as const, reason: 'no_response' as const, wanted: null },
    }
    const waiting = listingReducer(never, { type: 'filter', filters: cats, request: 2 })
    const failed = listingReducer(waiting, { type: 'failed', request: 2, reason: 'offline' })
    expect(failed.failure).toEqual({ on: 'open', reason: 'offline', wanted: cats })
    expect(failed.filters).toBe(linked)
  })

  it('una falla de «Ver más» no toca los filtros', () => {
    const waiting = listingReducer(STATE, { type: 'more', request: 2 })
    const failed = listingReducer(waiting, { type: 'failed', request: 2, reason: 'offline' })
    expect(failed.filters).toBe(STATE.filters)
    expect(failed.failure?.wanted).toBeNull()
  })

  it('una falla al renovar las fotos no dice nada', () => {
    const waiting = listingReducer(STATE, { type: 'refresh', request: 2 })
    expect(listingReducer(waiting, { type: 'failed', request: 2, reason: 'offline' })).toEqual({
      ...waiting,
      pending: 'none',
    })
  })

  it('una respuesta que llega limpia la falla anterior', () => {
    const failed = {
      ...STATE,
      failure: { on: 'more' as const, reason: 'offline' as const, wanted: null },
    }
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
      failure: { on: 'more' as const, reason: 'offline' as const, wanted: null },
    }
    expect(listingReducer(busy, { type: 'restored', view, filters: cats })).toEqual({
      ...STATE,
      ...view,
      filters: cats,
      shownFilters: cats,
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
    expect(
      canLoadMore({ ...STATE, failure: { on: 'more', reason: 'offline', wanted: null } }),
    ).toBe(true)
  })

  it('sin otra tanda, no', () => {
    expect(canLoadMore({ ...STATE, next: null })).toBe(false)
  })

  it('mientras llega un filtro, no: el cursor es de los filtros anteriores', () => {
    const waiting = listingReducer(STATE, { type: 'filter', filters: cats, request: 2 })
    expect(canLoadMore(waiting)).toBe(false)
  })

  it('después de que falló un filtro, sí: lo marcado es lo que se ve', () => {
    const waiting = listingReducer(STATE, { type: 'filter', filters: cats, request: 2 })
    const failed = listingReducer(waiting, { type: 'failed', request: 2, reason: 'offline' })
    expect(canLoadMore(failed)).toBe(true)
  })
})

describe('retryFilters', () => {
  it('después de una falla de filtro, lo que se había marcado', () => {
    const waiting = listingReducer(STATE, { type: 'filter', filters: cats, request: 2 })
    const failed = listingReducer(waiting, { type: 'failed', request: 2, reason: 'offline' })
    expect(retryFilters(failed)).toBe(cats)
  })

  it('sin falla de filtro, lo marcado', () => {
    const linked = { ...STATE, filters: cats, shownFilters: cats }
    expect(retryFilters(linked)).toBe(cats)
    const open = {
      ...linked,
      failure: { on: 'open' as const, reason: 'offline' as const, wanted: null },
    }
    expect(retryFilters(open)).toBe(cats)
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
