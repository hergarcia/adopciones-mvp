'use client'

import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'
import { usePublicErrorCopy } from '@/app/[locale]/_components/public-error-copy'

// Sin decir si la persona existe: un perfil que no se pudo traer no es uno que no existe.
export default function Error({ error, reset }: ErrorBoundaryProps) {
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
