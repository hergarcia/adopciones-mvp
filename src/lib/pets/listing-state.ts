import {
  listingSearch,
  parseListingQuery,
  parseMarked,
  queryOf,
  type ListingFilters,
} from './listing-query'
import type { ApiPage, ListingFailure } from './listing-requests'
import { STALE_PAGE_MINUTES } from './rules'
import type { ListedCardView } from './types'

// Las firmas de las fotos duran una hora: pasados 50 minutos desde que se firmaron, la pantalla las
// pide de nuevo antes de que venzan (research R11, FR-018).
export function isStale(signedAt: string, now: Date): boolean {
  return now.getTime() - Date.parse(signedAt) >= STALE_PAGE_MINUTES * 60_000
}

export type ListingView = {
  cards: ListedCardView[]
  next: string | null
  total: number
  totalText: string
  /** La firma más vieja de las fotos a la vista: la que vence primero. */
  signedAt: string
}

export type ListingState = ListingView & {
  /** Lo marcado; mientras llega un filtro, lo pedido. Quieto, busca lo mismo que `shownFilters`. */
  filters: ListingFilters
  /** Los filtros con los que se pidieron las cards a la vista. */
  shownFilters: ListingFilters
  pending: 'none' | 'filter' | 'more' | 'refresh'
  /** El pedido vigente: lo que llega de otro se descarta. */
  request: number
  failure: {
    on: 'open' | 'filter' | 'more'
    reason: ListingFailure
    /** Lo que se había marcado cuando falló un filtro: lo que pide «Reintentar». */
    wanted: ListingFilters | null
  } | null
}

export type ListingAction =
  | { type: 'filter'; filters: ListingFilters; request: number }
  | { type: 'more'; request: number }
  | { type: 'refresh'; request: number }
  | { type: 'loaded'; request: number; page: ApiPage }
  | { type: 'failed'; request: number; reason: ListingFailure }
  | { type: 'restored'; view: ListingView; filters: ListingFilters }

const older = (a: string, b: string) =>
  new Date(Math.min(Date.parse(a), Date.parse(b))).toISOString()

// El estado del listado con el navegador que ejecuta (research R4): las marcas, el total, las cards,
// el cursor y el pedido vigente cambian juntos. Un filtro nuevo reemplaza las cards y el total; «Ver
// más» agrega sin tocar el total (FR-015); lo que llega de un pedido viejo no cambia nada, y una
// falla deja lo que se veía con su motivo (FR-016). Si falla un filtro, lo marcado vuelve a los
// filtros de lo que se ve: el listado nunca dice un filtro que las cards no cumplen (#287).
export function listingReducer(state: ListingState, action: ListingAction): ListingState {
  if (action.type === 'restored') {
    const { filters } = action
    return {
      ...state,
      ...action.view,
      filters,
      shownFilters: filters,
      pending: 'none',
      failure: null,
    }
  }
  if (action.type === 'filter') {
    return { ...state, filters: action.filters, pending: 'filter', request: action.request }
  }
  if (action.type === 'more' || action.type === 'refresh') {
    return { ...state, pending: action.type, request: action.request }
  }
  if (action.request !== state.request) return state
  if (action.type === 'failed') {
    // Renovar las fotos es silencioso: si falla, siguen las que están.
    if (state.pending === 'refresh') return { ...state, pending: 'none' }
    const { reason } = action
    if (state.pending === 'more') {
      return { ...state, pending: 'none', failure: { on: 'more', reason, wanted: null } }
    }
    // Un vacío sí cargó: solo el listado que nunca llegó sigue siendo la falla al abrir.
    const on = state.failure?.on === 'open' ? 'open' : 'filter'
    return {
      ...state,
      filters: state.shownFilters,
      pending: 'none',
      failure: { on, reason, wanted: state.filters },
    }
  }
  const { page } = action
  const done = {
    ...state,
    shownFilters: state.filters,
    pending: 'none' as const,
    failure: null,
    next: page.next,
  }
  if (state.pending === 'more') {
    return {
      ...done,
      cards: [...state.cards, ...page.cards],
      signedAt: older(state.signedAt, page.signedAt),
    }
  }
  return {
    ...done,
    cards: page.cards,
    total: page.total ?? state.total,
    totalText: page.totalText ?? state.totalText,
    signedAt: page.signedAt,
  }
}

// «Ver más» sigue la tanda de lo que se ve: mientras llega un filtro nuevo, las cards y el cursor son
// de los filtros anteriores, y pedir con ellos mezclaría dos búsquedas.
export function canLoadMore(state: ListingState): boolean {
  return state.next !== null && state.pending !== 'filter'
}

// Pedir de nuevo lo que quedó marcado traería lo mismo que ya se ve (research R3 de #287).
export function retryFilters(state: ListingState): ListingFilters {
  return state.failure?.wanted ?? state.filters
}

export type ListingSnapshot = ListingView & {
  href: string
  /** Se tocó una card: al volver atrás a esta misma dirección, se repone. */
  returning: boolean
  scrollY: number
}

// Volver atrás desde una ficha repone lo cargado y la posición (FR-016), solo si se salió tocando una
// card de esta misma dirección y las fotos todavía no vencieron; si no, lo que trajo el servidor.
export function restoreDecision(
  snapshot: ListingSnapshot | null,
  href: string,
  now: Date,
): ListingSnapshot | null {
  if (snapshot === null || !snapshot.returning || snapshot.href !== href) return null
  return isStale(snapshot.signedAt, now) ? null : snapshot
}

// Filtrar cambia la dirección sin navegar, así que al volver atrás el router puede reponer la vista
// que dibujó el servidor la primera vez, con los filtros de entonces. Manda la dirección (FR-017a):
// si dice otros filtros, son los que hay que pedir, como están marcados; si dice los mismos, nada.
export function filtersToReload(
  rendered: ListingFilters,
  search: string,
): { filters: ListingFilters; shown: number } | null {
  const query = queryOf(new URLSearchParams(search))
  const filters = parseMarked(query)
  if (listingSearch(filters) === listingSearch(rendered)) return null
  return { filters, shown: parseListingQuery(query).shown }
}
