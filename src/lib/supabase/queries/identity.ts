import { cache } from 'react'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import type { IdentityOrigin } from '@/lib/verification/identity'
import type { IdentityRecord } from '@/lib/verification/identity-status'
import { IDENTITY_DB_RULES } from '@/lib/verification/rules'
import { toOrigin, toRejections } from './identity-rows'
import { getSessionUser } from './session'

// La verificación de identidad de la persona (historia #11): lo propio se lee con su sesión y las
// policies deciden qué ve (plan §2); enviar y retirar van con permisos de servicio a las funciones
// de la base, con el id que ya sacó la acción de la sesión. Lo de quien administra está en
// `review.ts`. Entre los dos son la única puerta a las tablas nuevas.

// Lo propio: el pedido, la verificación, los rechazos y el vencimiento. Nulo sin sesión. Si la base
// no responde, lanza: la falla se ve en el `error.tsx` de la ruta y no se confunde con no haber
// pedido nunca.
export const getMyIdentity = cache(async (): Promise<IdentityRecord | null> => {
  const user = await getSessionUser()
  if (user === null) return null

  const supabase = await createServerSupabase()
  const [request, verification, rejections, expiration] = await Promise.all([
    supabase
      .from('identity_requests')
      .select('sent_at, expires_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('identity_verifications')
      .select('verified_on')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('identity_rejections').select('rejected_on, reason').eq('user_id', user.id),
    supabase.from('identity_expirations').select('expired_on').eq('user_id', user.id).maybeSingle(),
  ])
  const failed = [request, verification, rejections, expiration].find((read) => read.error)
  if (failed)
    throw new Error('No se pudo leer la verificación de identidad', { cause: failed.error })

  return {
    request: request.data
      ? { sentAt: new Date(request.data.sent_at), expiresAt: new Date(request.data.expires_at) }
      : null,
    verifiedOn: verification.data?.verified_on ?? null,
    rejections: toRejections(rejections.data ?? []),
    expiredOn: expiration.data?.expired_on ?? null,
  }
})

export type SubmitDecision = 'sent' | 'no_phone' | 'already_open' | 'already_verified' | 'capped'

const SUBMIT_DECISIONS: readonly SubmitDecision[] = [
  'sent',
  'no_phone',
  'already_open',
  'already_verified',
  'capped',
]

// Nulo si la base no respondió: la cadena termina en una acción, que no lanza.
export async function submitIdentityRequest(input: {
  userId: string
  origin: IdentityOrigin
  front: string
  selfie: string
}): Promise<{ decision: SubmitDecision } | null> {
  const { data, error } = await createServiceSupabase().rpc('submit_identity_request', {
    p_user_id: input.userId,
    p_origin: input.origin,
    p_front: input.front,
    p_selfie: input.selfie,
    ...IDENTITY_DB_RULES,
  })
  const decision = error ? undefined : data?.[0]?.decision
  const known = SUBMIT_DECISIONS.find((candidate) => candidate === decision)
  return known === undefined ? null : { decision: known }
}

export type WithdrawOutcome =
  | { decision: 'withdrawn'; sentAt: Date; origin: IdentityOrigin }
  | { decision: 'not_open' | 'expired' }

export async function withdrawIdentityRequest(userId: string): Promise<WithdrawOutcome | null> {
  const { data, error } = await createServiceSupabase().rpc('withdraw_identity_request', {
    p_user_id: userId,
  })
  const row = error ? undefined : data?.[0]
  if (row === undefined) return null
  if (row.decision === 'withdrawn' && row.request_sent_at) {
    return {
      decision: 'withdrawn',
      sentAt: new Date(row.request_sent_at),
      origin: toOrigin(row.request_origin),
    }
  }
  if (row.decision === 'not_open' || row.decision === 'expired') return { decision: row.decision }
  return null
}

export type ExpiryNotice = { userId: string; expiredOn: string; origin: IdentityOrigin }

// Los avisos de vencimiento que esperan su correo. Con permisos de servicio: los lee la ruta de la
// tarea programada, que no tiene sesión.
export async function listPendingExpiryNotices(): Promise<ExpiryNotice[]> {
  const { data, error } = await createServiceSupabase()
    .from('identity_expirations')
    .select('user_id, expired_on, notice_origin')
    .eq('notice_pending', true)
  if (error) throw new Error('No se pudieron leer los avisos de vencimiento', { cause: error })
  return data.map((row) => ({
    userId: row.user_id,
    expiredOn: row.expired_on,
    origin: toOrigin(row.notice_origin),
  }))
}

// Se marca haya salido o no: se intenta una vez (FR-026).
export async function markExpiryNoticeSent(userId: string): Promise<void> {
  await createServiceSupabase()
    .from('identity_expirations')
    .update({ notice_pending: false, notice_origin: null })
    .eq('user_id', userId)
}
