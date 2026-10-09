import { getTranslations } from 'next-intl/server'
import { QuestionNotFound } from '@/components/questions/question-not-found'
import { PageShell } from '@/app/[locale]/_components/page-shell'

export default async function NotFound() {
  const t = await getTranslations('questions.not_found')
  return (
    <PageShell width="full">
      <QuestionNotFound texts={{ title: t('title'), body: t('body'), action: t('action') }} />
    </PageShell>
  )
}
