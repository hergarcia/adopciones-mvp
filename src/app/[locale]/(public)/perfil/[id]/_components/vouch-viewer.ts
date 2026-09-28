import { getMyIdentity } from '@/lib/supabase/queries/identity'
import { getMyPhone } from '@/lib/supabase/queries/phones'
import { getMyProfile } from '@/lib/supabase/queries/profiles'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { getVouchStanding } from '@/lib/supabase/queries/vouches'
import { identityStatus } from '@/lib/verification/identity-status'
import { verificationLevel } from '@/lib/verification/level'
import { isLevelOne, phoneStatus } from '@/lib/verification/phone-status'
import { nextStepToLevelTwo } from '@/lib/vouches/next-step'
import type { VouchSlotInput } from '@/lib/vouches/vouch-slot'
import { NO_STANDING } from '@/lib/vouches/vouch-slot'

// Quién mira el perfil, en los hechos que pide `vouchSlot`: si es la dueña, su nivel 2, el paso que
// le falta y la relación con la persona mirada. Nulo sin sesión.
export async function vouchViewer(
  publicId: string,
): Promise<Pick<VouchSlotInput, 'viewer' | 'standing'>> {
  const user = await getSessionUser()
  if (user === null) return { viewer: null, standing: NO_STANDING }

  const [profile, phoneRow, record, standing] = await Promise.all([
    getMyProfile(),
    getMyPhone(),
    getMyIdentity(),
    getVouchStanding(user.id, publicId),
  ])
  const now = new Date()
  const phone = phoneStatus(phoneRow, now)
  const identity = record === null ? ({ kind: 'none' } as const) : identityStatus(record, now)
  // El nivel 2 alcanza: el 3 no cambia lo que se puede hacer con un aval.
  const levelTwo =
    verificationLevel(phone, identity.kind === 'approved' ? { verifiedOn: identity.on } : null) >= 2

  return {
    viewer: {
      isOwner: profile?.publicId === publicId,
      levelTwo,
      step: nextStepToLevelTwo({
        hasProfile: profile !== null,
        levelOne: isLevelOne(phone),
        identity: identity.kind,
      }),
    },
    standing: standing ?? NO_STANDING,
  }
}
