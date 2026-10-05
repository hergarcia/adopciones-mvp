import { pauseMark, type PauseMark } from './my-vouches'
import type { NextStep } from './next-step'
import type { VouchStanding } from './types'

export type VouchSlot =
  | { kind: 'none' }
  | { kind: 'sign_in' }
  | { kind: 'vouching' }
  | { kind: 'vouching_paused'; mark: Exclude<PauseMark, null> }
  | { kind: 'reciprocal' }
  | { kind: 'blocked' }
  | { kind: 'cannot_receive' }
  | { kind: 'needs_level_two'; step: NextStep }
  | { kind: 'can_vouch' }

export type VouchSlotInput = {
  /** Nulo sin sesión. `step` es el paso que le falta si no tiene nivel 2. */
  viewer: { isOwner: boolean; levelTwo: boolean; step: NextStep } | null
  standing: VouchStanding
  targetLevelTwo: boolean
}

/** Sin nada entre las dos: sin sesión, o antes del primer aval. */
export const NO_STANDING: VouchStanding = {
  viewerVouches: false,
  targetVouchesViewer: false,
  blockedByTarget: false,
  viewerBlockedTarget: false,
  targetBlockedViewer: false,
}

// El lugar de avalar, en el orden exacto de FR-011: primero lo que ya existe entre las dos —un aval
// dado, que siempre se puede retirar; uno recibido; una quita—, después lo que la mirada no puede
// recibir y al final lo que le falta a quien mira. Así nadie pierde el retiro de un aval en pausa, y
// nadie es mandado a verificarse para un aval que igual no podría dar. `give_vouch` repite las
// reglas de escritura en la base, que es donde valen; esto decide qué se ve.
export function vouchSlot({ viewer, standing, targetLevelTwo }: VouchSlotInput): VouchSlot {
  if (viewer === null) return targetLevelTwo ? { kind: 'sign_in' } : { kind: 'none' }
  if (viewer.isOwner) return { kind: 'none' }
  // Un bloqueo, en cualquier dirección, no deja lugar de avalar ni dice por qué (FR-017, #13).
  if (standing.viewerBlockedTarget || standing.targetBlockedViewer) return { kind: 'none' }
  if (standing.viewerVouches) {
    const mark = pauseMark({
      mineLacksLevelTwo: !viewer.levelTwo,
      otherLacksLevelTwo: !targetLevelTwo,
    })
    return mark === null ? { kind: 'vouching' } : { kind: 'vouching_paused', mark }
  }
  if (standing.targetVouchesViewer) return { kind: 'reciprocal' }
  if (standing.blockedByTarget) return { kind: 'blocked' }
  if (!targetLevelTwo) return { kind: 'cannot_receive' }
  if (!viewer.levelTwo) return { kind: 'needs_level_two', step: viewer.step }
  return { kind: 'can_vouch' }
}
