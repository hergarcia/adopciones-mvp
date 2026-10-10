'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export default function Error({ error, reset }: ErrorBoundaryProps) {
  const t = useTranslations('common.error_screen')
  const applications = useTranslations('applications.errors')

  return (
    <ErrorScreen
      error={error}
      title={t('title')}
      body={applications('form_load_error')}
      retry={applications('retry')}
      reset={reset}
    />
  )
}
