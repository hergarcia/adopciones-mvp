import type { TrackedEvent } from '@/lib/analytics/events'
import { isLinkPreview } from '@/lib/analytics/link-preview'
import type { LitterPageState } from '@/lib/litters/litter-page-state'
import type { PetPageState } from '@/lib/pets/pet-page-state'
import type { ApplyCount } from './types'

type PageKind = PetPageState['kind'] | LitterPageState['kind']

// Una ficha que existe suma en cualquier estado: el enlace pegado en el grupo sigue trayendo gente
// (FR-001). Las de quien publicó con su sesión no suman, y la de una cría la suma su camada (FR-003).
const COUNTED: readonly PageKind[] = ['listed', 'paused', 'expired', 'unavailable', 'blocked']

export function shouldCountOpen(page: { kind: PageKind; userAgent: string | null }): boolean {
  return COUNTED.includes(page.kind) && !isLinkPreview(page.userAgent)
}

// Los mismos momentos que ya cuentan la medición (#240): el bloque y la medición no pueden contar
// distinto. El tope y un animal que no recibe no son frenos de la verificación (FR-006).
export function applyCountOf(events: readonly TrackedEvent[]): ApplyCount {
  let tap = false
  let stop: ApplyCount['stop'] = null
  for (const event of events) {
    if (event.name === 'apply_tapped') tap = true
    if (
      // Stryker disable next-line ConditionalExpression: equivalente, solo `apply_stopped` trae `props.by` (events.ts)
      event.name === 'apply_stopped' &&
      (event.props.by === 'phone' || event.props.by === 'identity')
    )
      stop = event.props.by
  }
  return { tap, stop }
}
