'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export default function Error({ error, reset }: ErrorBoundaryProps) {
  const t = useTranslations('common.error_screen')
  const vouches = useTranslations('vouches.mine')

  // Acá sí se sabe qué se estaba trayendo, así que el texto lo dice (docs/10 §Textos).
  return (
    <ErrorScreen
      error={error}
      title={t('title')}
      body={vouches('load_error')}
      retry={vouches('retry')}
      reset={reset}
    />
  )
}
