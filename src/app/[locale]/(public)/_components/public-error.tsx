'use client'

import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'
import { usePublicErrorCopy } from '@/app/[locale]/_components/public-error-copy'

export function PublicError({ error, reset }: ErrorBoundaryProps) {
  const copy = usePublicErrorCopy()
  if (copy === null) return null
  return (
    <ErrorScreen
      error={error}
      title={copy.title}
      body={copy.body}
      retry={copy.retry}
      reset={reset}
    />
  )
}
