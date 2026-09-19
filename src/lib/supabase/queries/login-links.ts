import { createServiceSupabase } from '@/lib/supabase/service'
import { UNCONFIRMED_ACCOUNT_TTL_DAYS } from '@/lib/auth/stale-accounts'
import type { LinkRecord } from '@/lib/auth/link-status'

const HOUR_MS = 60 * 60 * 1000

export type StoredLink = LinkRecord & { id: string; email: string }

export async function getLoginLink(id: string): Promise<StoredLink | null> {
  const { data } = await createServiceSupabase()
    .from('login_links')
    .select('id, email, expires_at, consumed_at, superseded_at')
    .eq('id', id)
    .maybeSingle()

  if (!data) return null

  return {
    id: data.id,
    email: data.email,
    expiresAt: new Date(data.expires_at),
    consumedAt: data.consumed_at === null ? null : new Date(data.consumed_at),
    supersededAt: data.superseded_at === null ? null : new Date(data.superseded_at),
  }
}

export async function countRecentLinks(email: string, now: Date): Promise<number> {
  const { count } = await createServiceSupabase()
    .from('login_links')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .eq('delivery', 'sent')
    .gte('issued_at', new Date(now.getTime() - HOUR_MS).toISOString())

  return count ?? 0
}

// Pedir uno nuevo mata al anterior (FR-004). Se hace antes de emitir, así que entre los dos no
// queda un instante con dos enlaces vivos para la misma dirección.
export async function supersedeLinks(email: string, now: Date): Promise<void> {
  await createServiceSupabase()
    .from('login_links')
    .update({ superseded_at: now.toISOString() })
    .eq('email', email)
    .is('consumed_at', null)
    .is('superseded_at', null)
}

export async function recordLoginLink(input: {
  email: string
  expiresAt: Date
  delivery: 'sent' | 'skipped_rate_limit'
}): Promise<string> {
  const { data, error } = await createServiceSupabase()
    .from('login_links')
    .insert({
      email: input.email,
      expires_at: input.expiresAt.toISOString(),
      delivery: input.delivery,
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`no se pudo registrar el enlace: ${error?.message}`)
  return data.id
}

export async function markLinkConsumed(id: string, now: Date): Promise<void> {
  await createServiceSupabase()
    .from('login_links')
    .update({ consumed_at: now.toISOString() })
    .eq('id', id)
}

export async function deleteLinksFor(email: string): Promise<void> {
  await createServiceSupabase().from('login_links').delete().eq('email', email)
}

// Corre al pedir un enlace, que es lo único que hace crecer la tabla, y al borrar una cuenta.
// Cuando exista el cron diario (M5) pasa a correr ahí también y deja de depender del tráfico.
export async function purgeExpired(now: Date): Promise<void> {
  const cutoff = new Date(now.getTime() - UNCONFIRMED_ACCOUNT_TTL_DAYS * 24 * HOUR_MS)
  await createServiceSupabase().from('login_links').delete().lt('issued_at', cutoff.toISOString())
}
