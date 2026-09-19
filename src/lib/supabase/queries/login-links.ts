import { createServiceSupabase } from '@/lib/supabase/service'
import { UNCONFIRMED_ACCOUNT_TTL_DAYS } from '@/lib/auth/stale-accounts'
import type { LinkRecord } from '@/lib/auth/link-status'

const HOUR_MS = 60 * 60 * 1000

// `failed` existe para que un envío que no salió no consuma el cupo de la dirección: la fila se
// registra igual, porque la pantalla del enlace la necesita, pero no cuenta (FR-003a).
export type Delivery = 'sent' | 'skipped_rate_limit' | 'failed'

export type StoredLink = LinkRecord & { id: string; email: string; firstSignIn: boolean }

export async function getLoginLink(id: string): Promise<StoredLink | null> {
  const { data } = await createServiceSupabase()
    .from('login_links')
    .select('id, email, expires_at, consumed_at, superseded_at, first_sign_in')
    .eq('id', id)
    .maybeSingle()

  if (!data) return null

  return {
    id: data.id,
    email: data.email,
    firstSignIn: data.first_sign_in,
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

// Pedir uno nuevo mata a los anteriores (FR-004), pero **después** de que el nuevo salió: matarlos
// antes dejaría a la persona sin el viejo y sin el nuevo si el envío falla, o directamente sin
// ninguno cuando el tope mudo por dirección impide mandar (FR-003a, FR-006c). Por eso hay que
// poder excluir el recién emitido.
export async function supersedeLinks(email: string, now: Date, exceptId: string): Promise<void> {
  await createServiceSupabase()
    .from('login_links')
    .update({ superseded_at: now.toISOString() })
    .eq('email', email)
    .neq('id', exceptId)
    .is('consumed_at', null)
    .is('superseded_at', null)
}

// Mata uno solo: el que se emitió y no se pudo mandar.
export async function supersedeLink(id: string, now: Date): Promise<void> {
  await createServiceSupabase()
    .from('login_links')
    .update({ superseded_at: now.toISOString() })
    .eq('id', id)
}

// Devuelve null en vez de lanzar: la cadena que lo llama termina en una Server Action, y una
// acción que lanza le muestra a la persona la pantalla de error de Next en lugar de su mensaje
// (docs/08 §Server Actions no lanzan).
export async function recordLoginLink(input: {
  email: string
  expiresAt: Date
  delivery: Delivery
  firstSignIn?: boolean
}): Promise<string | null> {
  const { data, error } = await createServiceSupabase()
    .from('login_links')
    .insert({
      email: input.email,
      expires_at: input.expiresAt.toISOString(),
      delivery: input.delivery,
      first_sign_in: input.firstSignIn ?? false,
    })
    .select('id')
    .single()

  return error || !data ? null : data.id
}

export async function markLinkFailed(id: string): Promise<void> {
  await createServiceSupabase().from('login_links').update({ delivery: 'failed' }).eq('id', id)
}

export async function markLinkConsumed(id: string, now: Date): Promise<void> {
  await createServiceSupabase()
    .from('login_links')
    .update({ consumed_at: now.toISOString() })
    .eq('id', id)
}

export async function deleteLinksFor(email: string): Promise<{ ok: boolean }> {
  const { error } = await createServiceSupabase().from('login_links').delete().eq('email', email)

  return { ok: error === null }
}

// Corre al pedir un enlace, que es lo único que hace crecer la tabla, y al borrar una cuenta.
// Cuando exista el cron diario (M5) pasa a correr ahí también y deja de depender del tráfico.
export async function purgeExpired(now: Date): Promise<void> {
  const cutoff = new Date(now.getTime() - UNCONFIRMED_ACCOUNT_TTL_DAYS * 24 * HOUR_MS)
  await createServiceSupabase().from('login_links').delete().lt('issued_at', cutoff.toISOString())
}
