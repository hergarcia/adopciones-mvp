import type { IdentityStatus } from '@/lib/verification/identity-status'

/** El paso que le falta a alguien para llegar a nivel 2, el que se le ofrece (FR-011.7, US4-AS5). */
export type NextStep =
  | { kind: 'complete_profile' }
  /** Con `restoresLevelTwo`, ya tiene la identidad aprobada: con el teléfono vuelve a nivel 2. */
  | { kind: 'verify_phone'; restoresLevelTwo: boolean }
  | { kind: 'verify_identity' }
  /** No hay nada que tocar: el pedido espera la revisión, que tarda días. */
  | { kind: 'identity_in_review' }

export function nextStepToLevelTwo(viewer: {
  hasProfile: boolean
  levelOne: boolean
  identity: IdentityStatus['kind']
}): NextStep {
  if (!viewer.hasProfile) return { kind: 'complete_profile' }
  if (!viewer.levelOne) {
    return { kind: 'verify_phone', restoresLevelTwo: viewer.identity === 'approved' }
  }
  if (viewer.identity === 'in_review') return { kind: 'identity_in_review' }
  return { kind: 'verify_identity' }
}
