import { DEFAULT_DESTINATION, SIGN_IN_PATH } from '@/lib/auth/next-destination'
import { SUSPENDED_SCREEN_PATH } from './paths'
import type { AccountStanding } from './types'

// La puerta de una sesión (research R4): a dónde va antes de pintar o actuar, o null si sigue.
// Cerrada ante la duda: si no se pudo preguntar, a la pantalla de suspendida, que vuelve a preguntar
// y deja reintentar, así una caída no le abre el sitio a una suspendida.
export function standingGate(standing: AccountStanding): string | null {
  return standing.kind === 'active' ? null : SUSPENDED_SCREEN_PATH
}

export type SuspendedScreenVerdict =
  | { kind: 'show'; reason: string; since: string }
  | { kind: 'redirect'; to: string }
  | { kind: 'error' }

/** Lo inverso, en la pantalla de suspendida. `null` es sin sesión. */
export function suspendedScreenGate(standing: AccountStanding | null): SuspendedScreenVerdict {
  if (standing === null) return { kind: 'redirect', to: SIGN_IN_PATH }
  if (standing.kind === 'active') return { kind: 'redirect', to: DEFAULT_DESTINATION }
  if (standing.kind === 'unknown') return { kind: 'error' }
  return { kind: 'show', reason: standing.reason, since: standing.since }
}
