'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export default function Error({ error, reset }: ErrorBoundaryProps) {
  const t = useTranslations('common.error_screen')
  const alerts = useTranslations('alerts.mine')

  return (
    <ErrorScreen
      error={error}
      title={t('title')}
      body={alerts('load_error')}
      retry={alerts('retry')}
      reset={reset}
    />
  )
}
