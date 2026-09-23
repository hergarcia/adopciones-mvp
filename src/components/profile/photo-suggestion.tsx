'use client'

import { useId } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useImageStatus } from '@/hooks/use-image-status'
import { Avatar } from './avatar'

export type PhotoSuggestionTexts = {
  question: string
  use: string
  alt: string
}

type Props = {
  texts: PhotoSuggestionTexts
  url: string
  displayName: string
  loading: boolean
  disabled: boolean
  onUse: () => void
  buttonRef?: React.Ref<HTMLButtonElement>
}

// La foto de Google como propuesta y no como hecho: es la cara que después va a ser pública, así
// que entra al perfil solo si la persona la elige (FR-030b). Sobre piedra y sin borde, porque es
// secundaria: la foto del perfil es el cuadro de arriba.
export function PhotoSuggestion({
  texts,
  url,
  displayName,
  loading,
  disabled,
  onUse,
  buttonRef,
}: Props) {
  const status = useImageStatus(url)
  const questionId = useId()

  // Sin la foto a la vista no hay nada que ofrecer: nadie elige una foto que no ve.
  if (status === 'failed') return null

  return (
    <div className="flex items-center gap-4 bg-surface p-4">
      {status === 'loading' ? (
        <Skeleton className="size-12" />
      ) : (
        <Avatar displayName={displayName} url={url} alt={texts.alt} />
      )}
      <div className="flex flex-col items-start gap-2">
        <p id={questionId} className="text-base text-ink">
          {texts.question}
        </p>
        <Button
          ref={buttonRef}
          variant="secondary"
          size="sm"
          loading={loading}
          disabled={disabled}
          aria-describedby={questionId}
          onClick={onUse}
        >
          {texts.use}
        </Button>
      </div>
    </div>
  )
}
