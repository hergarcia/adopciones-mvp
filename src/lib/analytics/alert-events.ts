import { countFilters } from '@/lib/alerts/filters'
import type { AlertFilters } from '@/lib/alerts/types'
import type { AlertDeleteOrigin, TrackedEvent } from './events'

// Lo que se mide de los avisos (historia #265, research R12): cuántos filtros, nunca cuáles, ni la
// persona, ni el aviso, ni el día (FR-041).
export function alertCreatedEvent(filters: AlertFilters, fromEmpty: boolean): TrackedEvent {
  return {
    name: 'pet_alert_created',
    props: { filters: countFilters(filters), from_empty: fromEmpty },
  }
}

export function alertDeletedEvent(origin: AlertDeleteOrigin): TrackedEvent {
  return { name: 'pet_alert_deleted', props: { origin } }
}
