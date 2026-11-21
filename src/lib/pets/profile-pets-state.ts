import { publicProfilePath } from '@/lib/profile/public-paths'
import { CURSOR_KEY, SHOWN_KEY } from './listing-query'
import type { ApiPage, ListingFailure } from './listing-requests'
import type { ListedCardView } from './types'

export type ProfilePetsState = {
  cards: ListedCardView[]
  /** El cursor de «Ver más», o null si no quedan. */
  next: string | null
  pending: 'none' | 'retry' | 'more'
  failure: { on: 'open' | 'more'; reason: ListingFailure } | null
  /** Sube con cada falla: el aviso se vuelve a montar y se anuncia otra vez. */
  request: number
}

export type ProfilePetsAction =
  | { type: 'retry_started' }
  | { type: 'more_started' }
  | { type: 'loaded'; page: ApiPage }
  | { type: 'failed'; reason: ListingFailure }

/** La primera tanda que trajo el servidor, o `null` si la base no respondió al abrir el perfil. */
export function profilePetsInitial(first: ApiPage | null): ProfilePetsState {
  return {
    cards: first?.cards ?? [],
    next: first?.next ?? null,
    pending: 'none',
    failure: first === null ? { on: 'open', reason: 'no_response' } : null,
    request: 0,
  }
}

// «Probar de nuevo» solo existe con la falla al abrir y trae la primera tanda entera, que reemplaza a
// lo que había; «Ver más» suma. Una falla deja lo que se veía y dice cuál de los dos falló (FR-009,
// FR-009a). Lo que llega sin nada pendiente es de un pedido que ya no cuenta.
export function profilePetsReducer(
  state: ProfilePetsState,
  action: ProfilePetsAction,
): ProfilePetsState {
  if (action.type === 'retry_started') {
    return state.failure?.on === 'open' ? { ...state, pending: 'retry' } : state
  }
  if (action.type === 'more_started') {
    return state.next === null ? state : { ...state, pending: 'more' }
  }
  if (state.pending === 'none') return state
  if (action.type === 'failed') {
    return {
      ...state,
      pending: 'none',
      failure: { on: state.pending === 'more' ? 'more' : 'open', reason: action.reason },
      request: state.request + 1,
    }
  }
  const cards =
    state.pending === 'more' ? [...state.cards, ...action.page.cards] : action.page.cards
  return { ...state, cards, next: action.page.next, pending: 'none', failure: null }
}

/** Las tandas para la hoja cliente: sin cursor, la primera («Probar de nuevo»). */
export function profilePetsApiHref(publicId: string, cursor: string | null): string {
  const path = `/api${publicProfilePath(publicId)}/animales`
  return cursor === null ? path : `${path}?${CURSOR_KEY}=${encodeURIComponent(cursor)}`
}

/** «Ver más» sin JavaScript: el perfil con `shown` a la vista y el ancla al primero nuevo. */
export function profilePetsMoreHref(publicId: string, shown: number, firstNew: number): string {
  return `${publicProfilePath(publicId)}?${SHOWN_KEY}=${shown}#a-${firstNew}`
}
