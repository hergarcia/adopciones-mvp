'use client'

import { useErrorTexts } from '@/app/[locale]/_components/error-texts'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

// También cuando no se pudo saber cómo está la cuenta (research R4): reintentar vuelve a preguntar.
export default function Error({ error, reset }: ErrorBoundaryProps) {
  const t = useErrorTexts('common.error_screen')
  const screen = useErrorTexts('moderation.suspended_screen')

  return (
    <ErrorScreen
      error={error}
      title={t('title')}
      body={screen('load_error')}
      retry={t('retry')}
      reset={reset}
    />
  )
}
