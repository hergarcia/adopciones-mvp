import { useSearchParams } from 'next/navigation'
import { useEffect, useEffectEvent, useReducer, useRef, useState, type RefObject } from 'react'
import { addedFilterOptions } from '@/lib/analytics/listing-events'
import {
  NO_FILTERS,
  listingHref,
  listingSearch,
  parseMarked,
  queryOf,
  type ListingFilters,
} from '@/lib/pets/listing-query'
import { listingApiHref } from '@/lib/pets/listing-requests'
import {
  filtersToReload,
  isStale,
  listingReducer,
  restoreDecision,
  type ListingSnapshot,
  type ListingState,
} from '@/lib/pets/listing-state'
import { LISTING_MAX_SHOWN, LISTING_PAGE_SIZE } from '@/lib/pets/rules'
import { useListingPages } from './use-listing-pages'
import { useOnResume } from './use-on-resume'

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
export function useListing(
  initial: ListingState,
  storage: Storage,
  formRef: RefObject<HTMLFormElement | null>,
) {
  const [state, dispatch] = useReducer(listingReducer, initial)
  const [hydrated, setHydrated] = useState(false)
  const requests = useRef(0)
  const request = useListingPages()
  const restored = useRef<{ cards: ListingState['cards']; scrollY: number } | null>(null)

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
    if (!isStale(state.signedAt, new Date())) return
    const shown = shownFor(state.cards.length)
    void run('refresh', listingApiHref(state.filters, { shown }), state.filters)
  })

  // Volver atrás desde una ficha repone lo cargado y la posición (FR-016).
  const restore = useEffectEvent((): boolean => {
    const snapshot = restoreDecision(storage.read(), here(), new Date())
    storage.write(null)
    if (snapshot === null) return false
    const filters = parseMarked(queryOf(new URLSearchParams(window.location.search)))
    dispatch({ type: 'restored', view: snapshot, filters })
    restored.current = { cards: snapshot.cards, scrollY: snapshot.scrollY }
    return true
  })

  // La posición se repone cuando lo repuesto ya está dibujado: antes, con solo la primera tanda en
  // la página, el navegador la recorta a lo que entra.
  useEffect(() => {
    if (restored.current === null || restored.current.cards !== state.cards) return
    window.scrollTo(0, restored.current.scrollY)
    restored.current = null
  }, [state.cards])

  // Sin nada que reponer, la vista puede ser la primera que dibujó el servidor aunque la dirección
  // ya diga otros filtros (`filtersToReload`): se piden los de la dirección, sin medirlos de nuevo.
  const reload = useEffectEvent((search: string): boolean => {
    const behind = filtersToReload(state.filters, search)
    if (behind === null) return false
    void run('filter', listingApiHref(behind.filters, { shown: behind.shown }), behind.filters)
    return true
  })

  // Lo que se marcó antes de que llegara el listado (historia #95, FR-011): la casilla quedó marcada
  // en el HTML del servidor, y se aplica apenas llega.
  const catchUp = useEffectEvent((): boolean => {
    if (formRef.current === null) return false
    const marked = formFilters(formRef.current)
    if (listingSearch(marked) === listingSearch(state.filters)) return false
    applyFilters(marked)
    return true
  })

  useEffect(() => {
    // Hidratado: los filtros se aplican al tocarlos y «Ver más» suma sin recargar.
    // eslint-disable-next-line react/set-state-in-effect
    setHydrated(true)
    // Lo repuesto ya tiene las fotos vigentes (`restoreDecision`), y en este render `state` todavía
    // es el del servidor: renovar con él pisaría lo repuesto con los filtros de la primera carga.
    if (!restore() && !catchUp() && !reload(window.location.search)) refreshIfStale()
  }, [])

  useOnResume(() => refreshIfStale())

  // El router puede cambiar la dirección sin volver a dibujar el listado (ir a «Animales en
  // adopción» después de filtrar lo resuelve con lo que tiene guardado), así que la vista sigue a la
  // dirección (FR-017a). Lo que escribe este mismo hook ya coincide con su estado y no pide nada.
  const search = useSearchParams().toString()
  const followAddress = useEffectEvent((address: string) => {
    if (hydrated) reload(address)
  })
  useEffect(() => followAddress(search), [search])

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
