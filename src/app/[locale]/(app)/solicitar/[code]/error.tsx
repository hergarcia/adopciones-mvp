'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen } from '@/app/[locale]/_components/error-screen'

export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations('common.error_screen')
  const applications = useTranslations('applications.errors')

  return (
    <ErrorScreen
      title={t('title')}
      body={applications('form_load_error')}
      retry={applications('retry')}
      reset={reset}
    />
  )
}
