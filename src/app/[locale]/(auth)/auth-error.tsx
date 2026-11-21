'use client'

import { useErrorTexts } from '@/app/[locale]/_components/error-texts'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export function AuthError({ error, reset }: ErrorBoundaryProps) {
  const t = useErrorTexts('common.error_screen')

  return (
    <ErrorScreen
      error={error}
      title={t('title')}
      body={t('body')}
      retry={t('retry')}
      reset={reset}
    />
  )
}
