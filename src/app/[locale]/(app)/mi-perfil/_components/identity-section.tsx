import { getTranslations } from 'next-intl/server'
import { IdentityStatusCard } from '@/components/verification/identity-status-card'
import { ReviewQueueLink } from '@/components/verification/review-queue-link'
import { track } from '@/lib/analytics/track'
import { isAdmin } from '@/lib/supabase/queries/review'
import { countPendingReviews } from '@/lib/supabase/queries/review-queue'
import type { IdentityStatus } from '@/lib/verification/identity-status'
import { identityCardTexts } from '@/app/[locale]/_components/identity-status-texts'

type Props = {
  status: IdentityStatus
  levelOne: boolean
}

// «Tu identidad» en «Mi perfil», y para quien administra, el acceso a la cola con cuántos esperan.
// La oferta de nivel 2 vista es un momento de FR-035: se marca cuando se dibuja, que es cuando la
// persona la ve.
export async function IdentitySection({ status, levelOne }: Props) {
  if (status.kind === 'none' && levelOne) {
    await track('identity_offer_viewed', { origin: 'profile' })
  }
  const [texts, admin] = await Promise.all([identityCardTexts(status, levelOne), isAdmin()])
  const t = await getTranslations('review.queue')

  return (
    <IdentityStatusCard kind={status.kind} texts={texts}>
      {admin ? (
        <ReviewQueueLink
          label={t('link', { count: await countPendingReviews() })}
          href="/revision"
        />
      ) : null}
    </IdentityStatusCard>
  )
}
