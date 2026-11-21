import { listingHref, NO_FILTERS } from '@/lib/pets/listing-query'
import type { Species } from '@/lib/pets/options'
import { MARK_PARAM } from '@/lib/pets/share-url'
import type { DepartmentCode } from '@/lib/zones/departments'
import type { ApplicationStatus, CloseReason } from './types'

// Los cierres en que la persona perdió el animal sin elegirlo (historia #259). Retirarla fue su
// decisión, y después de un bloqueo o una suspensión el sitio no empuja a nadie a seguir solicitando.
const LOST_CLOSES: readonly CloseReason[] = ['adopted', 'unpublished', 'not_receiving']

/** Si Mi solicitud ofrece otros animales para pedir: no aceptada (también sin efecto) o perdida. */
export function offersSuggestions(application: {
  status: ApplicationStatus
  closeReason: CloseReason | null
}): boolean {
  if (application.status === 'rejected') return true
  return (
    application.status === 'closed' &&
    LOST_CLOSES.some((reason) => reason === application.closeReason)
  )
}

/** El valor de `?desde=` de la ficha abierta desde un sugerido: no dice quién ni qué solicitud. */
export const SUGGESTION_MARK = 'sugerido'

export function suggestionHref(petHref: string): string {
  return `${petHref}?${MARK_PARAM}=${SUGGESTION_MARK}`
}

/** El listado con la especie del animal pedido y el departamento de la persona ya filtrados. */
export function suggestionsListingHref(species: Species, department: DepartmentCode): string {
  return listingHref({ ...NO_FILTERS, species: [species], department: [department] })
}
