'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen } from '@/app/[locale]/_components/error-screen'

export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations('common.error_screen')
  const reports = useTranslations('moderation.reports')

  return (
    <ErrorScreen title={t('title')} body={reports('load_error')} retry={t('retry')} reset={reset} />
  )
}
