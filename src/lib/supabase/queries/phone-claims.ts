import { createServiceSupabase } from '@/lib/supabase/service'
import type { Claim, ClaimFacts } from '@/lib/verification/claim-outcome'
import { URUGUAY_TIME_ZONE } from '@/lib/verification/rules'
import { getSessionUser } from './session'

// La prueba no tiene policies ni permisos para el cliente, tampoco para su dueña (FR-013e): la lee
// el servidor con permisos de servicio, después de comprobar la sesión, y solo la de esa sesión.
// Nulo sin sesión, sin prueba vigente, o si la base no respondió.
export async function getMyClaim(): Promise<Claim | null> {
  const user = await getSessionUser()
  if (user === null) return null

  const { data, error } = await createServiceSupabase().rpc('get_phone_claim', {
    p_user_id: user.id,
  })
  const row = error ? undefined : data?.[0]
  return row ? { number: row.number, validUntil: new Date(row.valid_until) } : null
}

const OUTCOMES: readonly ClaimFacts['outcome'][] = ['claimed', 'verified_free', 'no_claim']

function isOutcome(value: string): value is ClaimFacts['outcome'] {
  return (OUTCOMES as readonly string[]).includes(value)
}

export async function claimPhoneNumber(userId: string, number: string): Promise<ClaimFacts | null> {
  const { data, error } = await createServiceSupabase().rpc('claim_phone_number', {
    p_user_id: userId,
    p_number: number,
    p_time_zone: URUGUAY_TIME_ZONE,
  })
  const row = error ? undefined : data?.[0]
  if (!row || !isOutcome(row.outcome)) return null

  return {
    outcome: row.outcome,
    wasChange: row.was_change ?? false,
    wasLost: row.was_lost ?? false,
    previousUserId: row.previous_user_id ?? null,
    lostOn: row.lost_on ?? null,
  }
}

export async function dropClaim(userId: string): Promise<{ ok: boolean }> {
  const { error } = await createServiceSupabase().rpc('drop_phone_claim', { p_user_id: userId })
  return { ok: error === null }
}
