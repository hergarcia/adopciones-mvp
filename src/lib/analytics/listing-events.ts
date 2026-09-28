import { LISTING_FILTERS, type AddedOption, type ListingFilters } from '@/lib/pets/listing-query'
import { LISTING_PATH } from '@/lib/pets/paths'
import { isPreviewBot } from '@/lib/seo/preview-bots'
import type { TrackedEvent } from './events'

type PetView = {
  visibility: 'listed' | 'hidden'
  isOwner: boolean
  referer: string | null
  /** El `host` del pedido: un listado de otro sitio no es «desde el listado». */
  host: string | null
  userAgent: string | null
}

function comesFromListing(referer: string | null, host: string | null): boolean {
  const url = URL.parse(String(referer))
  return url?.host === host && url.pathname === LISTING_PATH
}

// «Vio una ficha» (FR-023): solo a la vista, nunca la del propio publicador, y nunca un lector de
// vista previa, que pide la ficha cada vez que alguien pega el enlace (R16). Sin código ni cuenta.
export function petViewEvent(view: PetView): TrackedEvent | null {
  if (view.visibility !== 'listed' || view.isOwner || isPreviewBot(view.userAgent)) return null
  const origin = comesFromListing(view.referer, view.host) ? 'listing' : 'outside'
  return { name: 'pet_viewed', props: { origin } }
}

export function listingViewEvent(view: { userAgent: string | null }): TrackedEvent | null {
  return isPreviewBot(view.userAgent) ? null : { name: 'listing_viewed' }
}

// Una por opción que se sumó; desmarcar no cuenta, y un enlace que ya traía filtros tampoco.
export function addedFilterOptions(before: ListingFilters, after: ListingFilters): AddedOption[] {
  return LISTING_FILTERS.flatMap((filter) => {
    const was: readonly string[] = before[filter]
    const is: readonly string[] = after[filter]
    return is.filter((option) => !was.includes(option)).map((option) => ({ filter, option }))
  })
}
