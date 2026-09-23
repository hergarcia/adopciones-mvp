import { createServiceSupabase } from '@/lib/supabase/service'
import type { CheckFacts } from '@/lib/verification/code-check'
import type { ReserveDecision, Reserved } from '@/lib/verification/request-outcome'
import { DB_RULES } from '@/lib/verification/rules'

// Las funciones de la base que deciden lo que tiene consecuencias (plan §2). Van con permisos de
// servicio porque la tabla de códigos no la toca nadie desde el cliente; el `userId` lo pone la
// acción, que ya comprobó la sesión, y nunca viene del navegador. Devuelven null en vez de lanzar:
// la cadena termina en una Server Action, que no lanza (docs/08).

const DECISIONS: readonly ReserveDecision[] = [
  'same_number',
  'wait',
  'daily_cap',
  'site_cap',
  'skip',
  'send',
]

function isDecision(value: string): value is ReserveDecision {
  return (DECISIONS as readonly string[]).includes(value)
}

export async function nextPhoneCodeAt(userId: string): Promise<Date | null> {
  const { data, error } = await createServiceSupabase().rpc('next_phone_code_at', {
    p_user_id: userId,
    p_min_gap: DB_RULES.p_min_gap,
    p_window: DB_RULES.p_window,
    p_account_cap: DB_RULES.p_account_cap,
    p_site_cap: DB_RULES.p_site_cap,
  })
  const at = error ? null : data?.[0]?.available_at
  return at ? new Date(at) : null
}

export async function reservePhoneCode(input: {
  userId: string
  number: string
  numberGroup: number
  codeDigest: string
}): Promise<(Reserved & { codeId: string | null }) | null> {
  const { data, error } = await createServiceSupabase().rpc('reserve_phone_code', {
    p_user_id: input.userId,
    p_number: input.number,
    p_number_digest: input.numberGroup,
    p_code_digest: input.codeDigest,
    p_code_ttl: DB_RULES.p_code_ttl,
    p_min_gap: DB_RULES.p_min_gap,
    p_window: DB_RULES.p_window,
    p_account_cap: DB_RULES.p_account_cap,
    p_number_cap: DB_RULES.p_number_cap,
    p_site_cap: DB_RULES.p_site_cap,
  })
  const row = error ? undefined : data?.[0]
  if (!row || !isDecision(row.decision)) return null

  return {
    decision: row.decision,
    codeId: row.code_id,
    retryAt: row.retry_at ? new Date(row.retry_at) : null,
    reachedCap: row.reached_cap ?? false,
    reachedSiteCap: row.reached_site_cap ?? false,
  }
}

export async function settlePhoneCode(
  codeId: string,
  outcome: 'sent' | 'rejected' | 'failed',
): Promise<{ ok: boolean }> {
  const { error } = await createServiceSupabase().rpc('settle_phone_code', {
    p_code_id: codeId,
    p_outcome: outcome,
  })
  return { ok: error === null }
}

export async function checkPhoneCode(
  userId: string,
  codeDigest: string,
): Promise<CheckFacts | null> {
  const { data, error } = await createServiceSupabase().rpc('check_phone_code', {
    p_user_id: userId,
    p_code_digest: codeDigest,
    p_max_attempts: DB_RULES.p_max_attempts,
    p_window: DB_RULES.p_window,
  })
  const row = error ? undefined : data?.[0]
  if (!row) return null

  return {
    verified: row.verified ?? false,
    wasChange: row.was_change ?? false,
    inUse: row.in_use ?? false,
    noPending: row.no_pending ?? false,
    noLiveCode: row.no_live_code ?? false,
    matchesSuperseded: row.matches_superseded ?? false,
    expired: row.expired ?? false,
    exhausted: row.exhausted ?? false,
    attemptsLeft: row.attempts_left ?? null,
    liveNumber: row.live_number ?? null,
  }
}

export async function cancelPendingNumber(userId: string): Promise<{ ok: boolean }> {
  const { error } = await createServiceSupabase().rpc('cancel_pending_phone', {
    p_user_id: userId,
  })
  return { ok: error === null }
}

// Corre al pedir un código, que es lo único que hace crecer las tablas. Cuando exista el cron
// diario (M5) pasa a correr ahí y deja de depender del tráfico.
export async function purgePhoneRecords(): Promise<void> {
  await createServiceSupabase().rpc('purge_phone_records', {
    p_window: DB_RULES.p_window,
    p_pending_ttl: DB_RULES.p_pending_ttl,
  })
}
