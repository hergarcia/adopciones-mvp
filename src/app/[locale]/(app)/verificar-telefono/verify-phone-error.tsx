'use client'

import { useErrorTexts } from '@/app/[locale]/_components/error-texts'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export function VerifyPhoneError({ error, reset }: ErrorBoundaryProps) {
  const t = useErrorTexts('common.error_screen')
  const verification = useErrorTexts('verification.errors')

  return (
    <ErrorScreen
      error={error}
      title={t('title')}
      body={verification('load_error')}
      retry={t('retry')}
      reset={reset}
    />
  )
}
