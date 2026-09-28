import { cache } from 'react'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import type {
  IdentityOrigin,
  IdentityPhotoKind,
  RejectionReason,
} from '@/lib/verification/identity'
import { IDENTITY_DB_RULES } from '@/lib/verification/rules'
import { toOrigin } from './identity-rows'
import { getSessionUser } from './session'

// Lo de quien administra (historia #11): la cola, un pedido, sus imágenes, y resolver. Se lee con
// la sesión, así que las policies deciden: una cuenta que no administra no ve ningún pedido ajeno,
// y nadie ve una imagen fuera de su pedido vigente (FR-013, FR-019, FR-029).

// Si la sesión administra. Se pregunta en cada pantalla: dejar de administrar corta el acceso en ese
// momento (FR-022b).
export const isAdmin = cache(async (): Promise<boolean> => {
  const user = await getSessionUser()
  if (user === null) return false

  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw new Error('No se pudo saber si la sesión administra', { cause: error })
  return data !== null
})

// Una imagen, con la sesión: la policy la deja leer solo a quien administra, del pedido vigente y
// no propio (FR-019, FR-020, FR-029). PostgREST devuelve el `bytea` como texto hexadecimal.
export async function getReviewImage(
  id: string,
  kind: IdentityPhotoKind,
): Promise<Uint8Array | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('identity_request_images')
    .select('data')
    .eq('request_id', id)
    .eq('kind', kind)
    .maybeSingle()
  if (error || data === null || !data.data.startsWith('\\x')) return null
  return Uint8Array.from(Buffer.from(data.data.slice(2), 'hex'))
}

// Lo que se sabe de un pedido que quien administra tenía abierto: si sigue a la vista y si ya se
// resolvió. Un pedido vencido no está a la vista; eso lo termina de decir `reviewState` con el
// vencimiento que ya conocía la pantalla.
export async function getReviewRequestTrace(
  id: string,
): Promise<{ row: { expiresAt: Date } | null; resolved: boolean }> {
  const supabase = await createServerSupabase()
  const [request, resolution] = await Promise.all([
    supabase.from('identity_requests').select('expires_at').eq('id', id).maybeSingle(),
    supabase.from('identity_resolutions').select('request_id').eq('request_id', id).maybeSingle(),
  ])
  if (request.error || resolution.error) {
    throw new Error('No se pudo leer el pedido', { cause: request.error ?? resolution.error })
  }
  return {
    row: request.data ? { expiresAt: new Date(request.data.expires_at) } : null,
    resolved: resolution.data !== null,
  }
}

export type ResolveOutcome =
  | {
      decision: 'approved' | 'rejected'
      ownerId: string
      sentAt: Date
      origin: IdentityOrigin
      resolvedOn: string
      retryOn: string | null
      levelOne: boolean
    }
  | { decision: 'gone' | 'expired' | 'not_admin' | 'own_request' }

export async function resolveIdentityRequest(input: {
  requestId: string
  adminId: string
  outcome: 'approve' | 'reject'
  reason: RejectionReason | null
}): Promise<ResolveOutcome | null> {
  const { data, error } = await createServiceSupabase().rpc('resolve_identity_request', {
    p_request_id: input.requestId,
    p_admin: input.adminId,
    p_outcome: input.outcome,
    p_window_days: IDENTITY_DB_RULES.p_window_days,
    p_cap: IDENTITY_DB_RULES.p_cap,
    p_pending_ttl: IDENTITY_DB_RULES.p_pending_ttl,
    ...(input.reason === null ? {} : { p_reason: input.reason }),
  })
  const row = error ? undefined : data?.[0]
  if (row === undefined) return null

  switch (row.decision) {
    case 'approved':
    case 'rejected':
      if (!row.owner_id || !row.request_sent_at || !row.resolved_on) return null
      return {
        decision: row.decision,
        ownerId: row.owner_id,
        sentAt: new Date(row.request_sent_at),
        origin: toOrigin(row.request_origin),
        resolvedOn: row.resolved_on,
        retryOn: row.retry_on ?? null,
        levelOne: row.level_one ?? false,
      }
    case 'gone':
    case 'expired':
    case 'not_admin':
    case 'own_request':
      return { decision: row.decision }
    default:
      return null
  }
}
