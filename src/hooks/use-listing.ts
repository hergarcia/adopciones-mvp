import { useEffect, useEffectEvent, useReducer, useRef, useState } from 'react'
import { addedFilterOptions } from '@/lib/analytics/listing-events'
import {
  NO_FILTERS,
  listingHref,
  parseMarked,
  queryOf,
  type ListingFilters,
} from '@/lib/pets/listing-query'
import { listingApiHref } from '@/lib/pets/listing-requests'
import {
  isStale,
  listingReducer,
  restoreDecision,
  type ListingSnapshot,
  type ListingState,
} from '@/lib/pets/listing-state'
import { LISTING_MAX_SHOWN, LISTING_PAGE_SIZE } from '@/lib/pets/rules'
import { useListingPages } from './use-listing-pages'

type Storage = {
  read: () => ListingSnapshot | null
  write: (snapshot: ListingSnapshot | null) => void
}

const here = () => `${window.location.pathname}${window.location.search}`

// Lo que la dirección recuerda de «Ver más»: de a 24 y hasta 240 (FR-017a).
const shownFor = (count: number) =>
  Math.min(Math.ceil(Math.max(count, 1) / LISTING_PAGE_SIZE) * LISTING_PAGE_SIZE, LISTING_MAX_SHOWN)

function formFilters(form: HTMLFormElement): ListingFilters {
  const params = new URLSearchParams()
  for (const [key, value] of new FormData(form)) {
    if (typeof value === 'string') params.append(key, value)
  }
  return parseMarked(queryOf(params))
}

// El estado del listado con el navegador que ejecuta (research R4). Las reglas son `listingReducer`,
// `restoreDecision` e `isStale`, con su test; esto las conecta con los pedidos, la dirección, la
// pestaña y el almacenamiento de la sesión.
export function useListing(initial: ListingState, storage: Storage) {
  const [state, dispatch] = useReducer(listingReducer, initial)
  const [hydrated, setHydrated] = useState(false)
  const requests = useRef(0)
  const request = useListingPages()

  async function run(kind: 'filter' | 'more' | 'refresh', href: string, filters: ListingFilters) {
    requests.current += 1
    const id = requests.current
    dispatch(
      kind === 'filter' ? { type: 'filter', filters, request: id } : { type: kind, request: id },
    )
    const result = await request(href)
    if (result.kind === 'loaded') dispatch({ type: 'loaded', request: id, page: result.page })
    if (result.kind === 'failed') dispatch({ type: 'failed', request: id, reason: result.reason })
  }

  function applyFilters(filters: ListingFilters) {
    const added = addedFilterOptions(state.filters, filters)
    // Reemplaza, no suma: volver atrás sale del listado y no deshace un filtro (FR-017a).
    window.history.replaceState(null, '', listingHref(filters))
    void run('filter', listingApiHref(filters, { added }), filters)
  }

  // Las fotos se firman por una hora: una pestaña que se retoma las pide de nuevo (FR-018).
  const refreshIfStale = useEffectEvent(() => {
    if (document.visibilityState !== 'visible' || !isStale(state.signedAt, new Date())) return
    const shown = shownFor(state.cards.length)
    void run('refresh', listingApiHref(state.filters, { shown }), state.filters)
  })

  // Volver atrás desde una ficha repone lo cargado y la posición (FR-016).
  const restore = useEffectEvent(() => {
    const snapshot = restoreDecision(storage.read(), here(), new Date())
    storage.write(null)
    if (snapshot === null) return
    const filters = parseMarked(queryOf(new URLSearchParams(window.location.search)))
    dispatch({ type: 'restored', view: snapshot, filters })
    requestAnimationFrame(() => window.scrollTo(0, snapshot.scrollY))
  })

  useEffect(() => {
    // Hidratado: los filtros se aplican al tocarlos y «Ver más» suma sin recargar.
    // eslint-disable-next-line react/set-state-in-effect
    setHydrated(true)
    restore()
    refreshIfStale()
    document.addEventListener('visibilitychange', refreshIfStale)
    window.addEventListener('pageshow', refreshIfStale)
    return () => {
      document.removeEventListener('visibilitychange', refreshIfStale)
      window.removeEventListener('pageshow', refreshIfStale)
    }
  }, [])

  // Después de «Ver más», la dirección dice cuántas se ven, así un enlace copiado repone lo mismo.
  const settled = hydrated && state.pending === 'none' && state.failure === null
  useEffect(() => {
    if (!settled) return
    window.history.replaceState(null, '', listingHref(state.filters, shownFor(state.cards.length)))
  }, [settled, state.filters, state.cards.length])

  return {
    state,
    hydrated,
    onFormChange: (form: HTMLFormElement) => applyFilters(formFilters(form)),
    clear: () => applyFilters(NO_FILTERS),
    retry: () => void run('filter', listingApiHref(state.filters), state.filters),
    loadMore: () =>
      void run('more', listingApiHref(state.filters, { cursor: state.next }), state.filters),
    // Al tocar una card se guarda lo cargado y la posición, para reponerlos al volver atrás.
    remember: () =>
      storage.write({
        cards: state.cards,
        next: state.next,
        total: state.total,
        totalText: state.totalText,
        signedAt: state.signedAt,
        href: here(),
        returning: true,
        scrollY: window.scrollY,
      }),
  }
}
