'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

// También cuando no se pudo saber cómo está la cuenta (research R4): reintentar vuelve a preguntar.
export default function Error({ error, reset }: ErrorBoundaryProps) {
  const t = useTranslations('common.error_screen')
  const screen = useTranslations('moderation.suspended_screen')

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
