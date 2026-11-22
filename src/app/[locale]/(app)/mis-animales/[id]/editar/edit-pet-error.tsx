'use client'

import { useErrorTexts } from '@/app/[locale]/_components/error-texts'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export function EditPetError({ error, reset }: ErrorBoundaryProps) {
  const t = useErrorTexts('common.error_screen')
  const form = useErrorTexts('pets.form')

  return (
    <ErrorScreen
      error={error}
      title={t('title')}
      body={form('edit_load_error')}
      retry={form('retry')}
      reset={reset}
    />
  )
}
