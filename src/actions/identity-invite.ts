'use server'

import { revalidatePath } from 'next/cache'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import { dismissIdentityInviteRecord } from '@/lib/supabase/queries/identity-invite'
import { failed, type ActionResult } from './result'

const SESSION = 'identity.invite.errors.session'
const FAILED = 'identity.invite.errors.failed'

// «Ahora no» de la invitación de «Mis animales» (historia #281, R10). La pantalla no mira lo que
// devuelve: la nota ya se fue cuando contesta (FR-016). Sin JavaScript, revalidar es lo que hace que
// la página vuelva sin la nota.
export async function dismissIdentityInvite(): Promise<ActionResult<null>> {
  const outcome = await dismissIdentityInviteRecord()
  if (outcome === null) return failed(FAILED, 'dismiss_identity_invite')
  if (outcome === 'not_signed_in') return { ok: false, error: SESSION }
  if (outcome === 'dismissed') revalidatePath(MY_PETS_PATH)
  return { ok: true, data: null }
}
