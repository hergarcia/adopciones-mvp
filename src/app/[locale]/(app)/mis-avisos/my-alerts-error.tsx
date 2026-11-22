'use client'

import { useErrorTexts } from '@/app/[locale]/_components/error-texts'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export function MyAlertsError({ error, reset }: ErrorBoundaryProps) {
  const t = useErrorTexts('common.error_screen')
  const alerts = useErrorTexts('alerts.mine')

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
