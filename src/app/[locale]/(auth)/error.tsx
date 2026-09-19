'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen } from '@/app/[locale]/_components/error-screen'

export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations('common.error_screen')

  return <ErrorScreen title={t('title')} body={t('body')} retry={t('retry')} reset={reset} />
}
