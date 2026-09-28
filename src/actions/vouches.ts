'use server'

import { track } from '@/lib/analytics/track'
import { isPublicId } from '@/lib/profile/public-paths'
import { giveVouchAs, removeVouchAs, withdrawVouchAs } from '@/lib/supabase/queries/vouches'
import { lookupSession } from '@/lib/supabase/queries/session'
import { VOUCH_NOT_FOUND, VOUCH_SESSION_ERROR } from '@/lib/vouches/vouch-failure'
import type { RemoveOutcome, WithdrawOutcome } from '@/lib/vouches/types'
import type { ActionResult } from './result'

// Dar, retirar y quitar un aval. Ninguna confía en el cliente: miran la sesión de nuevo y dejan las
// reglas a la función de la base, que las comprueba con el estado de ese momento y con el candado
// del par (FR-013). El id que llega es el público; el de la cuenta sale de la sesión, así nadie
// avala, retira ni quita en nombre de otra persona (FR-026).

// El sitio no pudo: la pantalla lo dice como que no respondió (`classifyVouchOutcome`).
const VOUCH_SAVE_FAILED = 'vouches.errors.save_failed'

async function sessionUserId(): Promise<{ id: string } | { error: string }> {
  const { user, failed } = await lookupSession()
  // No poder preguntar por la sesión es una falla del sitio, no una sesión vencida.
  if (user === null) return { error: failed ? VOUCH_SAVE_FAILED : VOUCH_SESSION_ERROR }
  return { id: user.id }
}

export async function giveVouch(publicId: string): Promise<ActionResult<null>> {
  const session = await sessionUserId()
  if ('error' in session) return { ok: false, error: session.error }
  if (!isPublicId(publicId)) return { ok: false, error: VOUCH_NOT_FOUND }

  const given = await giveVouchAs(session.id, publicId)
  if (given === null) return { ok: false, error: VOUCH_SAVE_FAILED }
  if (given.outcome === 'not_found') return { ok: false, error: VOUCH_NOT_FOUND }
  if (given.outcome !== 'given') return { ok: false, error: `vouches.errors.${given.outcome}` }

  // Un reintento de un aval que ya estaba no es un aval nuevo, ni un paso a nivel 3 (FR-028).
  if (given.created) {
    await track('vouch_given')
    if (given.reachedLevelThree) await track('level_three_reached')
  }
  return { ok: true, data: null }
}

// Retirar lo que ya no está no es un error: la pantalla dice que no estaba (FR-019).
export async function withdrawVouch(
  publicId: string,
): Promise<ActionResult<{ outcome: WithdrawOutcome }>> {
  const session = await sessionUserId()
  if ('error' in session) return { ok: false, error: session.error }
  if (!isPublicId(publicId)) return { ok: true, data: { outcome: 'absent' } }

  const outcome = await withdrawVouchAs(session.id, publicId)
  if (outcome === null) return { ok: false, error: VOUCH_SAVE_FAILED }
  if (outcome === 'withdrawn') await track('vouch_withdrawn')
  return { ok: true, data: { outcome } }
}

// Quitar no se deshace: la quita se guarda aunque el aval ya no esté (FR-018).
export async function removeVouch(
  publicId: string,
): Promise<ActionResult<{ outcome: RemoveOutcome }>> {
  const session = await sessionUserId()
  if ('error' in session) return { ok: false, error: session.error }
  if (!isPublicId(publicId)) return { ok: true, data: { outcome: 'absent' } }

  const outcome = await removeVouchAs(session.id, publicId)
  if (outcome === null) return { ok: false, error: VOUCH_SAVE_FAILED }
  if (outcome === 'removed') await track('vouch_removed')
  return { ok: true, data: { outcome } }
}
