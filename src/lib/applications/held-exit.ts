import { petPath } from '@/lib/pets/paths'
import type { HeldLapseReason, LapsedHeldApplication } from './types'

/**
 * La única salida de una escrita que no salió (historia #294): el animal si hoy recibe, otros como
 * él si no, o solo el listado.
 */
export type HeldExit = { kind: 'pet'; href: string } | { kind: 'suggestions' } | { kind: 'listing' }

// Un bloqueo o una suspensión no son algo que el sitio le quedó debiendo a la persona: ni el animal
// ni sugeridos, como en #259.
const CLOSED_BY_THEM: readonly HeldLapseReason[] = ['you_blocked', 'suspended']

export function heldExit(
  held: Pick<LapsedHeldApplication, 'lapseReason' | 'receiving' | 'code'>,
): HeldExit {
  if (CLOSED_BY_THEM.includes(held.lapseReason)) return { kind: 'listing' }
  if (held.receiving === 'yes' && held.code !== null) {
    return { kind: 'pet', href: petPath(held.code) }
  }
  // Quien la retiró eligió irse: el animal vuelve solo si sigue recibiendo.
  return held.lapseReason === 'withdrawn' ? { kind: 'listing' } : { kind: 'suggestions' }
}
