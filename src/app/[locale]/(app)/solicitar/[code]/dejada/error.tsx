'use client'

import { useErrorTexts } from '@/app/[locale]/_components/error-texts'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

export default function Error({ error, reset }: ErrorBoundaryProps) {
  const t = useErrorTexts('common.error_screen')
  const held = useErrorTexts('applications.held.sent')
  const applications = useErrorTexts('applications.errors')

  return (
    <ErrorScreen
      error={error}
      title={t('title')}
      body={held('load_error')}
      retry={applications('retry')}
      reset={reset}
    />
  )
}
