import { queueStanding, wholeHours } from '@/lib/admin/queues'
import {
  QUEUE_KEYS,
  type AdminOrigin,
  type DigestClaim,
  type QueueKey,
  type RecordOrigin,
} from '@/lib/admin/types'
import type { TrackedEvent } from './events'

// Los eventos de la historia #73 (research R9). Cada uno se arma campo por campo: ni un nombre, ni
// un id, ni lo buscado salen nunca (FR-081).

export function adminOpenedEvent(from: AdminOrigin): TrackedEvent {
  return { name: 'admin_opened', props: { from } }
}

export function queueOverdueEvent(queue: QueueKey, overMs: number): TrackedEvent {
  return { name: 'admin_queue_overdue', props: { queue, hours_over: wholeHours(overMs) } }
}

/** El del resumen que salió: cuántos y las horas del más viejo de cada cola (0 sin pendientes). */
export function digestSentEvent(claim: DigestClaim, now: Date): TrackedEvent {
  const hours = (queue: QueueKey) => {
    const oldest = claim[queue].oldest
    return oldest === null ? 0 : wholeHours(Math.max(0, now.getTime() - oldest.getTime()))
  }
  return {
    name: 'admin_digest_sent',
    props: {
      identity_count: claim.identity.count,
      identity_hours: hours('identity'),
      pets_count: claim.pets.count,
      pets_hours: hours('pets'),
      reports_count: claim.reports.count,
      reports_hours: hours('reports'),
      overdue: QUEUE_KEYS.filter(
        (queue) => queueStanding(queue, claim[queue].oldest, now).kind === 'overdue',
      ),
    },
  }
}

export function recordOpenedEvent(from: RecordOrigin): TrackedEvent {
  return { name: 'admin_record_opened', props: { from } }
}

export function searchDoneEvent(found: boolean): TrackedEvent {
  return { name: 'admin_search_done', props: { found } }
}
