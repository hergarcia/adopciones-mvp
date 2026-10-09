import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { sendFeedback } from '@/actions/feedback'
import { FeedbackForm } from '@/components/feedback/feedback-form'
import { feedbackOrigin } from '@/lib/feedback/screens'
import { feedbackFormTexts } from '@/app/[locale]/_components/feedback-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.feedback')
  return {
    title: t('title'),
    description: t('description'),
    robots: { index: false, follow: false },
  }
}

// Opinar, con o sin sesión y también con la cuenta suspendida (spec §Decisiones): no pregunta por la
// sesión. La pantalla desde la que se llegó sale del `Referer`, porque el enlace es el mismo en todas.
export default async function FeedbackPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const request = await headers()
  const from = feedbackOrigin(request.get('referer'), request.get('host'))
  const [t, texts] = await Promise.all([getTranslations('feedback.form'), feedbackFormTexts()])

  return (
    <PageShell className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="afiche text-2xl text-ink">{t('title')}</h1>
        <p className="text-base text-ink-muted">{t('lead')}</p>
      </div>
      <FeedbackForm from={from} texts={texts} send={sendFeedback} />
    </PageShell>
  )
}
