'use client'

import { useErrorTexts } from '@/app/[locale]/_components/error-texts'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export function EditLitterError({ error, reset }: ErrorBoundaryProps) {
  const t = useErrorTexts('common.error_screen')
  const page = useErrorTexts('litters.page')
  const form = useErrorTexts('pets.form')

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
