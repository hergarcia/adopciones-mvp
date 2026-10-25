'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export default function Error({ error, reset }: ErrorBoundaryProps) {
  const t = useTranslations('common.error_screen')
  const page = useTranslations('litters.page')
  const form = useTranslations('pets.form')

  return (
    <ErrorScreen
      error={error}
      title={t('title')}
      body={page('load_error')}
      retry={form('retry')}
      reset={reset}
    />
  )
}
