'use client'

import { TextLink } from '@/components/ui/text-link'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'
import { usePublicErrorCopy } from '@/app/[locale]/_components/public-error-copy'

export default function Error({ error, reset }: ErrorBoundaryProps) {
  const copy = usePublicErrorCopy()
  if (copy?.exit === undefined) return null

  return (
    <ErrorScreen error={error} title={copy.title} body={copy.body} retry={copy.retry} reset={reset}>
      <TextLink href={copy.exit.href}>{copy.exit.label}</TextLink>
    </ErrorScreen>
  )
}
