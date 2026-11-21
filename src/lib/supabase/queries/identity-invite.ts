import { createServerSupabase } from '@/lib/supabase/server'
import { isDismissOutcome, type DismissOutcome } from '@/lib/verification/identity-invite'

// «Ahora no» de la invitación de «Mis animales» (historia #281). La tabla no se lee directo: la
// función de la base mira solo la fila de quien tiene la sesión (research R1).

/** Si quien tiene la sesión ya tocó «Ahora no». Lanza si la base falla: quien la usa decide. */
export async function isIdentityInviteDismissed(): Promise<boolean> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('identity_invite_dismissed')
  if (error) throw new Error('No se pudo leer «Ahora no» de la invitación', { cause: error })
  return data
}

/** Guarda «Ahora no» con el día de Uruguay; null si la base falla o contesta algo desconocido. */
export async function dismissIdentityInviteRecord(): Promise<DismissOutcome | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('dismiss_identity_invite')
  return !error && isDismissOutcome(data) ? data : null
}
