'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export default function Error({ error, reset }: ErrorBoundaryProps) {
  const t = useTranslations('common.error_screen')
  const profile = useTranslations('profile.view')

  // Acá sí se sabe qué se estaba trayendo, así que el texto lo dice (docs/10 §Textos).
  return (
    <ErrorScreen
      error={error}
      title={t('title')}
      body={profile('load_error')}
      retry={profile('retry')}
      reset={reset}
    />
  )
}
