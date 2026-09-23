'use client'

import { Button } from '@/components/ui/button'
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
}

// La foto de Google como propuesta y no como hecho: es la cara que después va a ser pública, así
// que entra al perfil solo si la persona la elige (FR-030b). Sobre piedra y sin borde, porque es
// secundaria: la foto del perfil es el cuadro de arriba.
export function PhotoSuggestion({ texts, url, displayName, loading, disabled, onUse }: Props) {
  return (
    <div className="flex items-center gap-4 bg-surface p-4">
      <Avatar displayName={displayName} url={url} alt={texts.alt} />
      <div className="flex flex-col items-start gap-2">
        <p className="text-base text-ink">{texts.question}</p>
        <Button variant="secondary" size="sm" loading={loading} disabled={disabled} onClick={onUse}>
          {texts.use}
        </Button>
      </div>
    </div>
  )
}
