'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export default function Error({ error, reset }: ErrorBoundaryProps) {
  const t = useTranslations('common.error_screen')
  const list = useTranslations('moderation.suspended_list')

  return (
    <ErrorScreen
      error={error}
      title={t('title')}
      body={list('load_error')}
      retry={t('retry')}
      reset={reset}
    />
  )
}
