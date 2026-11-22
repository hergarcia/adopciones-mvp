'use client'

import { useErrorTexts } from '@/app/[locale]/_components/error-texts'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export function MyBlocksError({ error, reset }: ErrorBoundaryProps) {
  const t = useErrorTexts('common.error_screen')
  const blocks = useErrorTexts('moderation.my_blocks')

  return (
    <ErrorScreen
      error={error}
      title={t('title')}
      body={blocks('load_error')}
      retry={blocks('retry')}
      reset={reset}
    />
  )
}
