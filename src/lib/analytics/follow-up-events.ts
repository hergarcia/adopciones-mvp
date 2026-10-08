import type { FollowUpEvent } from '@/lib/follow-ups/types'
import type { TrackedEvent } from './events'
import { daysSincePublished } from './pet-events'

// El pedido del día 30 o por qué no se hizo (FR-060, research R11). Nada de las personas ni del
// animal (FR-061).
export function followUpResolvedEvent(event: FollowUpEvent): TrackedEvent {
  return event.status === 'requested'
    ? { name: 'follow_up_requested' }
    : { name: 'follow_up_skipped', props: { reason: event.reason } }
}

// Quien adoptó respondió (FR-062): los días de calendario de Uruguay desde el pedido, cuántas fotos y
// si escribió algo; nunca el texto.
export function followUpAnsweredEvent(answer: {
  requestedAt: Date
  photoCount: number
  hasText: boolean
  now: Date
}): TrackedEvent {
  return {
    name: 'follow_up_answered',
    props: {
      days_since_requested: daysSincePublished(answer.requestedAt, answer.now),
      photo_count: answer.photoCount,
      has_text: answer.hasText,
    },
  }
}

// Quien lo dio vio la respuesta por primera vez (FR-062): los días desde que llegó.
export function followUpViewedEvent(answeredAt: Date, now: Date): TrackedEvent {
  return {
    name: 'follow_up_viewed',
    props: { days_since_answered: daysSincePublished(answeredAt, now) },
  }
}
