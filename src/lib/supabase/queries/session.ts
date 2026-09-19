import { createServerSupabase } from '@/lib/supabase/server'
import type { ProviderIdentity } from '@/lib/auth/google'

export type SessionUser = {
  id: string
  email: string
}

// La única puerta a la sesión desde fuera de lib/supabase/. Existe por la misma razón que las
// demás queries: si cambia cómo se guarda la sesión, cambia un archivo (docs/08).
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createServerSupabase()
  const { data } = await supabase.auth.getUser()
  if (!data.user?.email) return null
  return { id: data.user.id, email: data.user.email }
}

export async function endSession(): Promise<void> {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
}

// Canjea el token del correo por una sesión. Una cuenta borrada deja su enlace sin dueño: el
// servicio ya no conoce la dirección, así que esto falla y no recrea nada (FR-007b).
export async function consumeLoginToken(tokenHash: string): Promise<{ ok: boolean }> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: tokenHash })
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
export async function getProviderIdentities(userId: string): Promise<ProviderIdentity[]> {
  const { createServiceSupabase } = await import('@/lib/supabase/service')
  const { data } = await createServiceSupabase().auth.admin.getUserById(userId)

  return (data?.user?.identities ?? []).map((identity) => ({
    provider: identity.provider,
    identityData: identity.identity_data ?? null,
  }))
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
