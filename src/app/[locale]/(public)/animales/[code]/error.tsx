'use client'

import { LinkButton } from '@/components/ui/link-button'
import { LISTING_PATH } from '@/lib/pets/paths'
import { usePublicErrorCopy } from '@/app/[locale]/_components/public-error-copy'
import {
  preloadErrorScreen,
  PublicErrorScreen,
} from '@/app/[locale]/_components/public-error-screen'

preloadErrorScreen()

// Una falla del sitio al traer la ficha, nunca dicha como «no está publicado» (FR-009): reintentar,
// y el camino al listado.
export default function Error({ reset }: { reset: () => void }) {
  const copy = usePublicErrorCopy()
  if (copy === null) return null

  return (
    <PublicErrorScreen title={copy.title} body={copy.body} retry={copy.retry} reset={reset}>
      <div className="flex justify-center">
        <LinkButton href={LISTING_PATH} variant="ghost">
          {copy.toListing}
        </LinkButton>
      </div>
    </PublicErrorScreen>
  )
}
