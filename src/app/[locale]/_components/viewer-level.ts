import { getMyIdentity } from '@/lib/supabase/queries/identity'
import { getMyPhone } from '@/lib/supabase/queries/phones'
import { getMyProfile } from '@/lib/supabase/queries/profiles'
import { identityStatus } from '@/lib/verification/identity-status'
import { verificationLevel } from '@/lib/verification/level'
import { isLevelOne, phoneStatus } from '@/lib/verification/phone-status'
import { nextStepToLevelTwo, type NextStep } from '@/lib/vouches/next-step'

// Lo que el aval necesita saber de quien tiene la sesión: si llega a nivel 2 —el 3 no cambia lo que
// se puede hacer con un aval— y, si no, el paso que le falta. Lo usan el lugar de avalar y los vacíos
// de «Mis avales».
export async function viewerLevel(): Promise<{
  publicId: string | null
  levelTwo: boolean
  step: NextStep
}> {
  const [profile, phoneRow, record] = await Promise.all([
    getMyProfile(),
    getMyPhone(),
    getMyIdentity(),
  ])
  const now = new Date()
  const phone = phoneStatus(phoneRow, now)
  const identity = record === null ? ({ kind: 'none' } as const) : identityStatus(record, now)
  const level = verificationLevel(
    phone,
    identity.kind === 'approved' ? { verifiedOn: identity.on } : null,
  )
  return {
    publicId: profile?.publicId ?? null,
    levelTwo: level >= 2,
    step: nextStepToLevelTwo({
      hasProfile: profile !== null,
      levelOne: isLevelOne(phone),
      identity: identity.kind,
    }),
  }
}
