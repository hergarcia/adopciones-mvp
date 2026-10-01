import { uruguayDay } from '@/lib/pets/age'
import type { PetState, PetStatusAction } from '@/lib/pets/types'
import type { RenewalVia, TrackedEvent } from './events'

const DAY_MS = 86_400_000

type StatusChange = {
  action: PetStatusAction
  from: PetState
  to: PetState
  publishedAt: Date
  now: Date
  via: RenewalVia
}

function dayNumber(day: string): number {
  const [year, month, date] = day.split('-').map(Number)
  return Date.UTC(year, month - 1, date) / DAY_MS
}

// Días de calendario de Uruguay, como «Publicado hace…»: el mismo día es 0. Sin ids ni textos
// (FR-032): alcanza para saber cuánto tarda una adopción desde que se publica (SC-008).
export function daysSincePublished(publishedAt: Date, now: Date): number {
  return Math.max(0, dayNumber(uruguayDay(now)) - dayNumber(uruguayDay(publishedAt)))
}

// Renovar y volver a publicar tienen su propio evento, con desde dónde; las demás acciones son un
// cambio de estado con desde cuál y hacia cuál (research R11).
export function statusChangeEvent(change: StatusChange): TrackedEvent {
  if (change.action === 'renew') return { name: 'pet_renewed', props: { via: change.via } }
  if (change.action === 'republish') {
    const from = change.from === 'adopted' ? 'adopted' : 'expired'
    return { name: 'pet_republished', props: { from, via: change.via } }
  }
  return {
    name: 'pet_status_changed',
    props: {
      from: change.from,
      to: change.to,
      days_since_published: daysSincePublished(change.publishedAt, change.now),
    },
  }
}

export function deletedEvent(from: PetState): TrackedEvent {
  return { name: 'pet_deleted', props: { from } }
}
