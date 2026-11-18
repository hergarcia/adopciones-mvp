'use client'

import { useErrorTexts } from '@/app/[locale]/_components/error-texts'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export default function Error({ error, reset }: ErrorBoundaryProps) {
  const t = useErrorTexts('common.error_screen')
  const vouches = useErrorTexts('vouches.mine')

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
