import {
  LISTING_FILTERS,
  parseMarked,
  queryOf,
  type AddedOption,
  type ListingFilters,
} from '@/lib/pets/listing-query'
import { LISTING_PATH } from '@/lib/pets/paths'
import type { PetVisibility } from '@/lib/pets/types'
import { isLinkPreview } from './link-preview'
import type { TrackedEvent } from './events'

type PetView = {
  visibility: PetVisibility
  isOwner: boolean
  referer: string | null
  /** El `host` del pedido: un listado de otro sitio no es «desde el listado». */
  host: string | null
  userAgent: string | null
}

// El listado de este mismo sitio del que se llegó, o null.
function listingReferer(referer: string | null, host: string | null): URL | null {
  const url = URL.parse(String(referer))
  return url?.host === host && url.pathname === LISTING_PATH ? url : null
}

// «Vio una ficha» (FR-023): solo a la vista, nunca la del propio publicador, y nunca un lector de
// vista previa, que pide la ficha cada vez que alguien pega el enlace (R16). Sin código ni cuenta. La
// de una adoptada tampoco: mide el embudo de quien quiere adoptar (research R11 de la #59).
export function petViewEvent(view: PetView): TrackedEvent | null {
  if (view.visibility !== 'listed' || view.isOwner || isLinkPreview(view.userAgent)) return null
  const origin = listingReferer(view.referer, view.host) === null ? 'outside' : 'listing'
  return { name: 'pet_viewed', props: { origin } }
}

export function listingViewEvent(view: { userAgent: string | null }): TrackedEvent | null {
  return isLinkPreview(view.userAgent) ? null : { name: 'listing_viewed' }
}

// Una por opción que se sumó; desmarcar no cuenta, y un enlace que ya traía filtros tampoco.
export function addedFilterOptions(before: ListingFilters, after: ListingFilters): AddedOption[] {
  return LISTING_FILTERS.flatMap((filter) => {
    const was: readonly string[] = before[filter]
    const is: readonly string[] = after[filter]
    return is.filter((option) => !was.includes(option)).map((option) => ({ filter, option }))
  })
}

// Sin ejecutar nada, los filtros se aplican con el formulario, que vuelve a pedir el listado: lo que
// se sumó es lo nuevo respecto del listado del que se llegó (research R9). Un enlace que ya trae
// filtros, abierto desde otro lado, no suma nada.
export function addedFromReferer(
  referer: string | null,
  host: string | null,
  filters: ListingFilters,
): AddedOption[] {
  const url = listingReferer(referer, host)
  return url === null ? [] : addedFilterOptions(parseMarked(queryOf(url.searchParams)), filters)
}
