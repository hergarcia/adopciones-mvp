'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export default function Error({ error, reset }: ErrorBoundaryProps) {
  const t = useTranslations('common.error_screen')
  const blocks = useTranslations('moderation.my_blocks')

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
