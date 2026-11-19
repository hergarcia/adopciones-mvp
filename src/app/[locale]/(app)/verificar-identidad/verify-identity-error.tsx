'use client'

import { useErrorTexts } from '@/app/[locale]/_components/error-texts'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export function VerifyIdentityError({ error, reset }: ErrorBoundaryProps) {
  const t = useErrorTexts('common.error_screen')
  const identity = useErrorTexts('identity.errors')

  return (
    <ErrorScreen
      error={error}
      title={t('title')}
      body={identity('load_error')}
      retry={t('retry')}
      reset={reset}
    />
  )
}
