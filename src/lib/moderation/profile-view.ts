import type { ProfileView } from './types'

export type ProfileViewInput = {
  /** La cuenta existe, aunque esté suspendida. */
  exists: boolean
  isOwner: boolean
  isSuspended: boolean
  /** Quien mira bloqueó a la persona mirada. */
  viewerBlocked: boolean
  /** La persona mirada bloqueó a quien mira: no cambia nada de lo que ve (FR-017). */
  blockedByTarget: boolean
}

// Qué ve quien mira un perfil (FR-017, FR-017a): para quien bloqueó, el bloqueo gana sobre todo,
// también sobre la suspensión, así no se entera de ella; para cualquier otra, una suspendida se ve
// como una cuenta que no existe; la bloqueada ve el perfil como cualquier visitante.
export function profileView(input: ProfileViewInput): ProfileView {
  if (!input.exists) return 'not_found'
  if (input.viewerBlocked && !input.isOwner) return 'blocked'
  if (input.isSuspended) return 'not_found'
  return 'profile'
}
