import type { PetStatus } from '@/lib/pets/types'
import type { LitterState, LitterStatusAction, YoungState, YoungStatusAction } from './types'

type StoredYoung = { status: PetStatus; resumeStatus: 'available' | 'in_process' | null }

// La misma cuenta que `private.young_state`: pausada es el estado de su camada, y la cría vuelve a
// lo que guardó al pausarse (research R2).
export function youngStateOf(young: StoredYoung): YoungState {
  if (young.status === 'paused') return young.resumeStatus ?? 'available'
  return young.status
}

type StoredLitter = { takenDownAt: Date | null; pausedAt: Date | null; expiresAt: Date }

// La misma cuenta que `private.litter_state` (research R1): adoptada va antes que pausada y vencida,
// así marcar adoptada a la última cría de una camada pausada la deja adoptada (FR-030).
export function litterStateOf(litter: StoredLitter, young: YoungState[], now: Date): LitterState {
  if (litter.takenDownAt !== null) return 'taken_down'
  if (young.every((state) => state === 'adopted')) return 'adopted'
  if (litter.pausedAt !== null) return 'paused'
  if (litter.expiresAt <= now) return 'expired'
  return 'available'
}

// Las acciones de una cría según su estado y el de su camada (spec, Edge Cases). Con la camada
// pausada o vencida solo se entrega; adoptada entera, se vuelve a ofrecer volviendo a publicarla.
// Quitar vale en todos los estados salvo dada de baja y no está en la lista.
export function actionsForYoung(
  young: YoungState,
  litter: LitterState,
): readonly YoungStatusAction[] {
  if (litter === 'available') {
    if (young === 'available') return ['mark_in_process', 'mark_adopted']
    if (young === 'in_process') return ['mark_available', 'mark_adopted']
    return ['mark_available']
  }
  if ((litter === 'paused' || litter === 'expired') && young !== 'adopted') return ['mark_adopted']
  return []
}

const LITTER_ACTIONS: Record<LitterState, readonly LitterStatusAction[]> = {
  available: ['renew', 'pause'],
  paused: ['resume'],
  expired: ['republish'],
  adopted: ['republish'],
  taken_down: [],
}

/** Las acciones de la camada entera (spec, Edge Cases); borrar va aparte. */
export function actionsForLitter(state: LitterState): readonly LitterStatusAction[] {
  return LITTER_ACTIONS[state]
}

// La que se ofrece a la vista, como en un animal (`leadActionFor`): la que vuelve a poner la camada
// a la vista, o «Renovar» cuando vence pronto. Una adoptada no tiene: nada apura.
export function leadActionForLitter(
  state: LitterState,
  expiresSoon: boolean,
): LitterStatusAction | null {
  if (state === 'paused') return 'resume'
  if (state === 'expired') return 'republish'
  if (state === 'available' && expiresSoon) return 'renew'
  return null
}

// Lo que vuelve a poner la camada a la vista exige el teléfono verificado (FR-004); las acciones de
// una cría, nunca.
export function needsLevelOne(action: LitterStatusAction): boolean {
  return action !== 'pause'
}
