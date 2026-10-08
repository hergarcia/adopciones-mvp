import type { TrackedEvent } from './events'
import { daysSincePublished } from './pet-events'

type Handover = {
  /** Null con «por fuera del sitio». */
  acceptedAt: Date | null
  site: boolean
  publishedAt: Date
  acceptedCount: number
  now: Date
}

// Marcar adoptado (FR-070, research R10): a quién en tipo, días desde que se publicó y desde que se
// aceptó la elegida, y cuántas aceptadas tenía. Sin ids, nombres ni textos (FR-071). Los días son
// de calendario de Uruguay, como los de `pet_status_changed`.
export function handoverEvent(handover: Handover): TrackedEvent {
  return {
    name: 'pet_handed_over',
    props: {
      to: handover.site ? 'site' : 'outside',
      days_since_published: daysSincePublished(handover.publishedAt, handover.now),
      days_since_accepted:
        handover.acceptedAt === null ? null : daysSincePublished(handover.acceptedAt, handover.now),
      accepted_count: handover.acceptedCount,
    },
  }
}
