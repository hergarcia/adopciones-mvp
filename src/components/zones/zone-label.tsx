import type { DepartmentCode } from '@/lib/zones/departments'
import { zoneName } from '@/lib/zones/zone-name'

type Props =
  | { zone: { department: DepartmentCode; locality: string } }
  /** Ya armado con `zoneName`: la card del listado llega como texto desde la ruta de tandas. */
  | { text: string }

export function ZoneLabel(props: Props) {
  return (
    <p className="text-sm text-ink-muted">{'text' in props ? props.text : zoneName(props.zone)}</p>
  )
}
