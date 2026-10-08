import type { FollowUpEvent } from '@/lib/follow-ups/types'
import type { TrackedEvent } from './events'

// El pedido del día 30 o por qué no se hizo (FR-060, research R11). Nada de las personas ni del
// animal (FR-061).
export function followUpResolvedEvent(event: FollowUpEvent): TrackedEvent {
  return event.status === 'requested'
    ? { name: 'follow_up_requested' }
    : { name: 'follow_up_skipped', props: { reason: event.reason } }
}
