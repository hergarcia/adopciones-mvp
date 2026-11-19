'use client'

import { useErrorTexts } from '@/app/[locale]/_components/error-texts'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export function MyApplicationsError({ error, reset }: ErrorBoundaryProps) {
  const t = useErrorTexts('common.error_screen')
  const applications = useErrorTexts('applications.errors')

  return (
    <ErrorScreen
      error={error}
      title={t('title')}
      body={applications('load_error')}
      retry={applications('retry')}
      reset={reset}
    />
  )
}
