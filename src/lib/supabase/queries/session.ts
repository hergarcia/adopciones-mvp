import { createServerSupabase } from '@/lib/supabase/server'

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
