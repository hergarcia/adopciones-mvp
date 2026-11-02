import { IdentityInvite } from '@/components/verification/identity-invite'
import { track } from '@/lib/analytics/track'
import type { MyLitter } from '@/lib/litters/types'
import type { PetSummary } from '@/lib/pets/types'
import { getMyIdentity } from '@/lib/supabase/queries/identity'
import { isIdentityInviteDismissed } from '@/lib/supabase/queries/identity-invite'
import { identityInviteShown, inviteSubject } from '@/lib/verification/identity-invite'
import { myVerification } from '@/lib/verification/level'
import { identityFromInvitePath } from '@/lib/verification/paths'
import type { PhoneRow } from '@/lib/verification/phone-status'
import { identityInviteTexts } from '@/app/[locale]/_components/identity-invite-texts'

type Props = {
  phone: PhoneRow | null
  pets: PetSummary[]
  litters: MyLitter[]
  /** El `h1` de «Mis animales», que recibe el foco al cerrar la nota. */
  focusId: string
}

// La invitación a verificar la identidad (historia #281). Si no se puede saber la identidad o si ya
// tocó «Ahora no», no hay nota y la pantalla queda como hoy, sin aviso (FR-004, R9). Una camada
// cuenta como una publicación (FR-003). La invitación vista se mide al dibujarla, como la oferta de
// «Mi perfil», así las dos se comparan con la misma vara (FR-025, R7).
export async function IdentityInviteSlot({ phone, pets, litters, focusId }: Props) {
  const read = await Promise.all([getMyIdentity(), isIdentityInviteDismissed()]).catch(() => null)
  if (read === null || read[0] === null) return null
  const [record, dismissed] = read
  const status = myVerification({ phone, identity: record }, new Date())
  const shown = identityInviteShown({
    publications: pets.length + litters.length,
    phone: status.phone,
    identity: status.identity,
    dismissed,
  })
  if (!shown) return null
  await track('identity_offer_viewed', { origin: 'my_pets' })
  return (
    <div className="mt-8">
      <IdentityInvite
        texts={await identityInviteTexts(inviteSubject(pets, litters))}
        href={identityFromInvitePath()}
        focusId={focusId}
      />
    </div>
  )
}
