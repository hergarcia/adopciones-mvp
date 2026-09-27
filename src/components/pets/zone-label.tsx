import type { Zone } from '@/lib/pets/types'
import { zoneName } from '@/lib/zones/zone-name'

export function ZoneLabel({ zone }: { zone: Zone }) {
  return <p className="text-sm text-ink-muted">{zoneName(zone)}</p>
}
