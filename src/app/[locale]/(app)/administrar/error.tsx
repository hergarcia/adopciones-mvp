'use client'

import { useErrorTexts } from '@/app/[locale]/_components/error-texts'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export default function Error({ error, reset }: ErrorBoundaryProps) {
  const t = useErrorTexts('common.error_screen')
  const home = useErrorTexts('admin.home')

  return (
    <ErrorScreen
      error={error}
      title={t('title')}
      body={home('load_error')}
      retry={t('retry')}
      reset={reset}
    />
  )
}
