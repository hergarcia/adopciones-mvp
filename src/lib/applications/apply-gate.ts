import { MAX_ACTIVE_APPLICATIONS } from './rules'
import type { ApplyContext } from './types'

export type ApplyGate =
  | { kind: 'own' }
  | { kind: 'blocked_publisher' }
  | { kind: 'not_receiving' }
  | { kind: 'unavailable' }
  | { kind: 'has_active'; id: string }
  | { kind: 'rejected' }
  | { kind: 'limit' }
  | { kind: 'needs_phone' }
  | { kind: 'needs_identity' }
  | { kind: 'form'; inProcess: boolean }

// Qué ve quien toca «Quiero adoptar», en el orden de FR-003 (research R5): de lo que no se puede
// resolver desde ahí a lo que sí, con la verificación al final, así nadie verifica por un animal
// que no recibe solicitudes, que ya solicitó, que ya le rechazaron (R7) o para el que no tiene lugar. La suspensión ya la
// frenó la sesión. Quien bloqueó al publicador ve el bloqueo antes que nada, como en la ficha; la
// bloqueada ve «no recibe solicitudes», como si el animal no recibiera (FR-063).
export function applyGate(context: ApplyContext): ApplyGate {
  if (context.isOwner) return { kind: 'own' }
  if (context.blockedPublisher) return { kind: 'blocked_publisher' }
  if (context.receiving === 'closed' || context.blockedByPublisher) return { kind: 'not_receiving' }
  if (context.receiving === 'unavailable') return { kind: 'unavailable' }
  if (context.myActiveId !== null) return { kind: 'has_active', id: context.myActiveId }
  if (context.myRejected) return { kind: 'rejected' }
  if (context.activeCount >= MAX_ACTIVE_APPLICATIONS) return { kind: 'limit' }
  if (!context.levelOne) return { kind: 'needs_phone' }
  if (context.requiredLevel === 2 && !context.levelTwo) return { kind: 'needs_identity' }
  return { kind: 'form', inProcess: context.inProcess }
}
