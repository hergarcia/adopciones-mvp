import { getTranslations } from 'next-intl/server'
import { IdentityStatusCard } from '@/components/verification/identity-status-card'
import { ReviewQueueLink } from '@/components/verification/review-queue-link'
import { badgeCount } from '@/lib/admin/badge'
import { adminPathFrom } from '@/lib/admin/paths'
import { track } from '@/lib/analytics/track'
import { adminPendingTotal } from '@/lib/supabase/queries/admin'
import type { IdentityStatus } from '@/lib/verification/identity-status'
import type { VerificationLevel } from '@/lib/verification/level'
import { identityCardTexts } from '@/app/[locale]/_components/identity-card-texts'

type Props = {
  status: IdentityStatus
  level: VerificationLevel
}

// Sin número con 0 o si la cuenta no se pudo traer (FR-020, FR-021).
async function adminLinkLabel(count: number | null): Promise<string> {
  const t = await getTranslations('admin.nav')
  const badge = count === null ? null : badgeCount(count)
  return badge === null ? t('link') : t('link_count', { count: badge })
}

// «Tu identidad» en «Mi perfil», y para quien administra, un solo acceso a Administrar con lo que
// puede resolver (historia #73, FR-021), en lugar de uno por lista.
// La oferta de nivel 2 vista es un momento de FR-035: se marca cuando se dibuja, que es cuando la
// persona la ve.
export async function IdentitySection({ status, level }: Props) {
  if (status.kind === 'none' && level > 0) {
    await track('identity_offer_viewed', { origin: 'profile' })
  }
  const [texts, admin] = await Promise.all([identityCardTexts(status, level), adminPendingTotal()])

  return (
    <IdentityStatusCard kind={status.kind} texts={texts}>
      {admin.isAdmin ? (
        <ReviewQueueLink
          label={await adminLinkLabel(admin.count)}
          href={adminPathFrom('profile')}
        />
      ) : null}
    </IdentityStatusCard>
  )
}
