import { getSessionUser } from '@/lib/supabase/queries/session'
import { getVouchStanding } from '@/lib/supabase/queries/vouches'
import type { VouchSlotInput } from '@/lib/vouches/vouch-slot'
import { NO_STANDING } from '@/lib/vouches/vouch-slot'
import { viewerLevel } from '@/app/[locale]/_components/viewer-level'

// Quién mira el perfil, en los hechos que pide `vouchSlot`: si es la dueña, su nivel 2, el paso que
// le falta y la relación con la persona mirada. Nulo sin sesión.
export async function vouchViewer(
  publicId: string,
): Promise<Pick<VouchSlotInput, 'viewer' | 'standing'>> {
  const user = await getSessionUser()
  if (user === null) return { viewer: null, standing: NO_STANDING }

  const [level, standing] = await Promise.all([viewerLevel(), getVouchStanding(user.id, publicId)])
  return {
    viewer: { isOwner: level.publicId === publicId, levelTwo: level.levelTwo, step: level.step },
    standing: standing ?? NO_STANDING,
  }
}
