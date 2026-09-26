import { cache } from 'react'
import { createServerSupabase } from '@/lib/supabase/server'
import type { ProviderIdentity } from '@/lib/auth/google'
import { sessionLookupFailed } from '@/lib/auth/session-lookup'

export type SessionUser = {
  id: string
  email: string
}

// La única puerta a la sesión desde fuera de lib/supabase/. Existe por la misma razón que las
// demás queries: si cambia cómo se guarda la sesión, cambia un archivo (docs/08).
//
// Envuelta en `cache`: una pantalla la consulta desde el menú, desde la compuerta y desde la
// página, y cada llamada es una ida por HTTP al servicio. Con la caché de React es una sola por
// pedido, que es lo que pide el presupuesto de docs/10 §Principios 7.
export type SessionLookup = {
  user: SessionUser | null
  /** Sin persona porque no se pudo preguntar, no porque la sesión se haya cerrado. */
  failed: boolean
}

export const lookupSession = cache(async (): Promise<SessionLookup> => {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.getUser()
  if (!data.user?.email) return { user: null, failed: sessionLookupFailed(error) }
  return { user: { id: data.user.id, email: data.user.email }, failed: false }
})

export async function getSessionUser(): Promise<SessionUser | null> {
  return (await lookupSession()).user
}

// `local` cierra solo la sesión de este dispositivo; sin alcance, todas, como siempre.
export async function endSession(
  options: { scope?: 'global' | 'local' } = {},
): Promise<{ ok: boolean }> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.signOut({ scope: options.scope ?? 'global' })
  return { ok: error === null }
}

// Canjea el token del correo por una sesión. Una cuenta borrada deja su enlace sin dueño: el
// servicio ya no conoce la dirección, así que esto falla y no recrea nada (FR-007b).
//
// El tipo es `email` y no `magiclink`: para una dirección sin cuenta, `generateLink` emite un
// token de tipo `signup` aunque se le pida `magiclink`, y `verifyOtp` con `magiclink` lo rechaza
// con «Email link is invalid or has expired». `email` acepta los dos, que es justo lo que hace
// falta cuando no se quiere saber de antemano si la dirección ya tenía cuenta (FR-006a).
export async function consumeLoginToken(tokenHash: string): Promise<{ ok: boolean }> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.verifyOtp({ type: 'email', token_hash: tokenHash })
  return { ok: error === null }
}

// Con permisos de servicio, y por eso vive acá y no en una acción: borra la persona del servicio
// de autenticación, que arrastra el perfil por `on delete cascade`. Es el último paso del borrado.
export async function deleteAccountRecord(userId: string): Promise<{ ok: boolean }> {
  const { createServiceSupabase } = await import('@/lib/supabase/service')
  const { error } = await createServiceSupabase().auth.admin.deleteUser(userId)
  return { ok: error === null }
}

// Las identidades de proveedor, leídas con permisos de servicio: es el dato que escribe el
// servicio al recibir los claims y que la persona no puede editar, a diferencia de `user_metadata`.
export type AccountFacts = {
  identities: ProviderIdentity[]
  /** Cuándo nació la cuenta: con eso se sabe si nació en este mismo ingreso (FR-032). */
  createdAt: Date | null
}

export async function getAccountFacts(userId: string): Promise<AccountFacts> {
  const { createServiceSupabase } = await import('@/lib/supabase/service')
  const { data } = await createServiceSupabase().auth.admin.getUserById(userId)

  return {
    identities: (data?.user?.identities ?? []).map((identity) => ({
      provider: identity.provider,
      identityData: identity.identity_data ?? null,
    })),
    createdAt: data?.user?.created_at ? new Date(data.user.created_at) : null,
  }
}

export async function exchangeOAuthCode(code: string): Promise<{ ok: boolean }> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  return { ok: error === null }
}

export async function startGoogleSignIn(redirectTo: string): Promise<string | null> {
  const supabase = await createServerSupabase()
  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  })
  return data?.url ?? null
}
