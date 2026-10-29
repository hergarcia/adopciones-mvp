import { countFilters } from '@/lib/alerts/filters'
import { mailItemCount } from '@/lib/alerts/mail-parts'
import type { AlertFilters, AlertMailPart } from '@/lib/alerts/types'
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

/** «Dejar de recibir» cuenta un borrado desde el correo por cada aviso que cortó. */
export function alertsUnsubscribedEvents(deleted: number): TrackedEvent[] {
  return Array.from({ length: deleted }, () => alertDeletedEvent('mail'))
}

/** El de un correo de avisos que salió: cuántos animales y camadas trae y en cuántas partes. */
export function alertMailSentEvent(parts: readonly AlertMailPart[]): TrackedEvent {
  return {
    name: 'pet_alert_mail_sent',
    props: { items: mailItemCount(parts), parts: parts.length },
  }
}
