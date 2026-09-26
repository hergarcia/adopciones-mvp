import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ReviewDecision } from '@/components/verification/review-decision'
import { ReviewRequestView } from '@/components/verification/review-request-view'
import { ReviewWatcher } from '@/components/verification/review-watcher'
import { requireProfile } from '@/lib/auth/require-profile'
import { isAdmin } from '@/lib/supabase/queries/review'
import { getReviewRequest } from '@/lib/supabase/queries/review-queue'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import {
  reviewClosedTexts,
  reviewDecisionTexts,
  reviewRequestTexts,
} from '@/app/[locale]/_components/review-texts'

type Props = { params: Promise<{ locale: string; id: string }> }

const QUEUE_PATH = '/revision'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.review_request')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// Un pedido de la cola. Uno que no existe, que ya se cerró o que no es para quien mira es la misma
// pantalla de «no existe» (FR-013, FR-019).
export default async function ReviewRequestPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  await requireProfile(`${QUEUE_PATH}/${id}`)
  if (!(await isAdmin()) || !UUID.test(id)) notFound()
  const request = await getReviewRequest(id)
  if (request === null) notFound()

  const t = await getTranslations('review.request')
  const images = request.isOwn
    ? null
    : { front: `/api${QUEUE_PATH}/${id}/front`, selfie: `/api${QUEUE_PATH}/${id}/selfie` }

  return (
    <PageShell width="full">
      <ReviewWatcher
        requestId={id}
        expiresAt={request.expiresAt.toISOString()}
        texts={await reviewClosedTexts()}
        backHref={QUEUE_PATH}
      >
        <ReviewRequestView texts={await reviewRequestTexts(request)} images={images}>
          {request.isOwn ? (
            <p className="text-base text-ink">{t('own')}</p>
          ) : (
            <ReviewDecision
              requestId={id}
              texts={await reviewDecisionTexts(request.displayName)}
              profileHref="/mi-perfil"
            />
          )}
        </ReviewRequestView>
      </ReviewWatcher>
    </PageShell>
  )
}
