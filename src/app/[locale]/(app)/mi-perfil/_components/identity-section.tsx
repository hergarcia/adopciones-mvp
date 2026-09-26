import { IdentityStatusCard } from '@/components/verification/identity-status-card'
import { track } from '@/lib/analytics/track'
import type { IdentityStatus } from '@/lib/verification/identity-status'
import { identityCardTexts } from '@/app/[locale]/_components/identity-status-texts'

type Props = {
  status: IdentityStatus
  levelOne: boolean
}

// «Tu identidad» en «Mi perfil». La oferta de nivel 2 vista es un momento de FR-035: se marca
// cuando se dibuja, que es cuando la persona la ve.
export async function IdentitySection({ status, levelOne }: Props) {
  if (status.kind === 'none' && levelOne) {
    await track('identity_offer_viewed', { origin: 'profile' })
  }
  return <IdentityStatusCard kind={status.kind} texts={await identityCardTexts(status, levelOne)} />
}
