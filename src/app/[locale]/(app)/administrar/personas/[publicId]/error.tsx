'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen } from '@/app/[locale]/_components/error-screen'

export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations('common.error_screen')
  const record = useTranslations('admin.record')

  return (
    <ErrorScreen title={t('title')} body={record('load_error')} retry={t('retry')} reset={reset} />
  )
}
