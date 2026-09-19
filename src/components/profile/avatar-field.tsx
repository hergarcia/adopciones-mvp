'use client'

import { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { Skeleton } from '@/components/ui/skeleton'
import { ACCEPTED_TYPES, rejectionFor } from '@/lib/profile/avatar'
import { processAvatar } from '@/lib/profile/avatar-processing'
import { Avatar } from './avatar'

export type AvatarTexts = {
  add: string
  change: string
  remove: string
  alt: string
}

type Props = {
  texts: AvatarTexts
  displayName: string
  url: string | null
  onPick: (file: File) => void
  onRemove: () => void
  onError: (key: string) => void
  /** Ya traducido: por qué esta foto no entró. */
  error?: string | null
}

export function AvatarField({
  texts,
  displayName,
  url,
  onPick,
  onRemove,
  onError,
  error = null,
}: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [working, startTransition] = useTransition()

  function pick(file: File) {
    const rejection = rejectionFor(file)
    if (rejection !== null) {
      onError(rejection)
      return
    }

    startTransition(async () => {
      try {
        const processed = await processAvatar(file)
        // La vista previa recién cuando el procesado terminó: hay formatos que el navegador no
        // sabe dibujar tal como salen del teléfono, y prometerla antes dejaría un hueco.
        setPreview(URL.createObjectURL(processed))
        onPick(processed)
      } catch {
        onError('profile.errors.photo_failed')
      }
    })
  }

  const shown = preview ?? url

  // El motivo va debajo de la foto y no arriba del botón de guardar: una foto rechazada se explica
  // al lado del control que se tocó, no a media pantalla de distancia (docs/10 §Componentes).
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        {working ? (
          <Skeleton className="size-24" />
        ) : (
          <Avatar displayName={displayName} url={shown} alt={texts.alt} size="lg" />
        )}

        <div className="flex flex-col items-start gap-1">
          <Button variant="ghost" onClick={() => input.current?.click()} disabled={working}>
            {shown === null ? texts.add : texts.change}
          </Button>
          {shown === null ? null : (
            <Button
              variant="ghost"
              onClick={() => {
                setPreview(null)
                onRemove()
              }}
            >
              {texts.remove}
            </Button>
          )}
        </div>

        <input
          ref={input}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) pick(file)
            event.target.value = ''
          }}
        />
      </div>

      {error ? <ErrorText announce>{error}</ErrorText> : null}
    </div>
  )
}
