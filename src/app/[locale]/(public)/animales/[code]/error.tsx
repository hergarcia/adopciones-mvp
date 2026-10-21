'use client'

import { LinkButton } from '@/components/ui/link-button'
import { LISTING_PATH } from '@/lib/pets/paths'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'
import { usePublicErrorCopy } from '@/app/[locale]/_components/public-error-copy'

// Una falla del sitio al traer la ficha, nunca dicha como «no está publicado» (FR-009): reintentar,
// y el camino al listado. `ErrorScreen` va en el peso de apertura: si llegara después, una falla
// con la señal cortada dejaría la hoja en blanco y sin «Reintentar».
export default function Error({ error, reset }: ErrorBoundaryProps) {
  const copy = usePublicErrorCopy()
  if (copy === null) return null

  return (
    <ErrorScreen error={error} title={copy.title} body={copy.body} retry={copy.retry} reset={reset}>
      <LinkButton href={LISTING_PATH} variant="ghost">
        {copy.toListing}
      </LinkButton>
    </ErrorScreen>
  )
}
