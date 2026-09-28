import type { DepartmentCode } from '@/lib/zones/departments'
import { zoneName } from '@/lib/zones/zone-name'

export function ZoneLabel({ zone }: { zone: { department: DepartmentCode; locality: string } }) {
  return <p className="text-sm text-ink-muted">{zoneName(zone)}</p>
}
