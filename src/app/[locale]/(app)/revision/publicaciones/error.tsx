'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export default function Error({ error, reset }: ErrorBoundaryProps) {
  const t = useTranslations('common.error_screen')
  const review = useTranslations('pet_review.errors')

  return (
    <ErrorScreen
      error={error}
      title={t('title')}
      body={review('load_error')}
      retry={t('retry')}
      reset={reset}
    />
  )
}
