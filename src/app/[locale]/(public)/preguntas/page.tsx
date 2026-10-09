import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { QuestionIndex } from '@/components/questions/question-index'
import { questionsIndexViewEvent } from '@/lib/analytics/question-events'
import { trackAll } from '@/lib/analytics/track'
import { redirectIfSuspended } from '@/lib/auth/redirect-if-suspended'
import { QUESTIONS_PATH } from '@/lib/questions/paths'
import { PageShell } from '@/app/[locale]/_components/page-shell'
import { questionIndexTexts, questionMetadata } from '@/app/[locale]/_components/question-texts'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('questions.index')
  return questionMetadata({ title: t('title'), card: t('card'), path: QUESTIONS_PATH })
}

// El índice de «Preguntas y respuestas» (historia #8): las publicadas por grupo, entero desde el
// servidor; la apertura se cuenta con su origen antes de dibujar (FR-051).
export default async function QuestionsScreen({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  await redirectIfSuspended()

  const [{ texts, groups }, request] = await Promise.all([questionIndexTexts(), headers()])
  const view = questionsIndexViewEvent({
    referer: request.get('referer'),
    host: request.get('host'),
    userAgent: request.get('user-agent'),
  })
  await trackAll(view === null ? [] : [view])

  return (
    <PageShell width="full">
      <QuestionIndex texts={texts} groups={groups} />
    </PageShell>
  )
}
