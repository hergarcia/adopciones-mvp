import { getTranslations } from 'next-intl/server'
import { IdentityStatusCard } from '@/components/verification/identity-status-card'
import { ReviewQueueLink } from '@/components/verification/review-queue-link'
import { track } from '@/lib/analytics/track'
import { PET_REVIEW_PATH } from '@/lib/pets/paths'
import { countPetReviews } from '@/lib/supabase/queries/pet-reviews'
import { isAdmin } from '@/lib/supabase/queries/review'
import { countPendingReviews } from '@/lib/supabase/queries/review-queue'
import type { IdentityStatus } from '@/lib/verification/identity-status'
import type { VerificationLevel } from '@/lib/verification/level'
import { identityCardTexts } from '@/app/[locale]/_components/identity-card-texts'

type Props = {
  status: IdentityStatus
  level: VerificationLevel
}

// Si la cuenta no se pudo traer, el acceso igual, sin el número (spec §Pantallas, Mi perfil).
async function petsLinkLabel(): Promise<string> {
  const t = await getTranslations('review.queue')
  const count = await countPetReviews().catch(() => null)
  return count === null ? t('pets_link_plain') : t('pets_link', { count })
}

// «Tu identidad» en «Mi perfil», y para quien administra, los accesos a las dos listas con cuántos
// esperan: los pedidos de identidad y las publicaciones (historia #59).
// La oferta de nivel 2 vista es un momento de FR-035: se marca cuando se dibuja, que es cuando la
// persona la ve.
export async function IdentitySection({ status, level }: Props) {
  if (status.kind === 'none' && level > 0) {
    await track('identity_offer_viewed', { origin: 'profile' })
  }
  const [texts, admin] = await Promise.all([identityCardTexts(status, level), isAdmin()])
  const t = await getTranslations('review.queue')

  return (
    <IdentityStatusCard kind={status.kind} texts={texts}>
      {admin ? (
        <div className="flex flex-col items-start">
          <ReviewQueueLink
            label={t('link', { count: await countPendingReviews() })}
            href="/revision"
          />
          <ReviewQueueLink label={await petsLinkLabel()} href={PET_REVIEW_PATH} />
        </div>
      ) : null}
    </IdentityStatusCard>
  )
}
