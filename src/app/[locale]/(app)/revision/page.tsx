import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ReviewQueueList } from '@/components/verification/review-queue-list'
import { requireProfile } from '@/lib/auth/require-profile'
import { isAdmin } from '@/lib/supabase/queries/review'
import { listReviewQueue } from '@/lib/supabase/queries/review-queue'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { reviewCount, reviewQueueRows } from '@/app/[locale]/_components/review-texts'

type Props = { params: Promise<{ locale: string }> }

const QUEUE_PATH = '/revision'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.review')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// Quien no administra ve lo mismo que en una ruta que no existe (FR-013).
export default async function ReviewQueuePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  await requireProfile(QUEUE_PATH)
  if (!(await isAdmin())) notFound()

  const items = await listReviewQueue()
  const [t, count, rows] = await Promise.all([
    getTranslations('review.queue'),
    reviewCount(items.filter((item) => !item.isOwn).length),
    reviewQueueRows(items),
  ])

  return (
    <PageShell width="full">
      <h1 className="afiche text-2xl text-ink">{t('title')}</h1>
      <p className="mt-2 mb-6 text-base text-ink-muted">{count}</p>
      <ReviewQueueList
        rows={rows}
        texts={{ open: t('open'), own: t('own'), empty: t('empty'), back: t('back_profile') }}
        hrefs={{ request: (id) => `${QUEUE_PATH}/${id}`, back: '/mi-perfil' }}
      />
    </PageShell>
  )
}
