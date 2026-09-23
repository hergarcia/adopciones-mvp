'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { Skeleton } from '@/components/ui/skeleton'
import { ACCEPTED_TYPES, rejectionFor } from '@/lib/profile/avatar'
import { downloadPhoto, processAvatar } from '@/lib/profile/avatar-processing'
import { Avatar } from './avatar'
import { PhotoSuggestion, type PhotoSuggestionTexts } from './photo-suggestion'

export type AvatarTexts = {
  add: string
  change: string
  remove: string
  alt: string
  suggestion: PhotoSuggestionTexts
}

type Props = {
  texts: AvatarTexts
  displayName: string
  url: string | null
  suggestedUrl?: string | null
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
  suggestedUrl = null,
  onPick,
  onRemove,
  onError,
  error = null,
}: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [processing, startProcessing] = useTransition()
  // Aparte del procesado: el spinner va en el botón que se tocó, y no en «Usar esta foto» cuando
  // la foto vino del teléfono.
  const [fetching, startFetching] = useTransition()
  const working = processing || fetching

  // El botón que se tocó se deshabilita mientras trabaja y el foco se cae; con la foto de Google
  // puesta, además, la propuesta desaparece con su botón adentro. El foco vuelve cuando los
  // botones se habilitan: a «Cambiar foto» si salió, a «Usar esta foto» si no.
  const pickButton = useRef<HTMLButtonElement>(null)
  const suggestionButton = useRef<HTMLButtonElement>(null)
  const focusAfter = useRef<'pick' | 'suggestion' | null>(null)
  useEffect(() => {
    if (working || focusAfter.current === null) return
    const target = focusAfter.current === 'pick' ? pickButton : suggestionButton
    target.current?.focus()
    focusAfter.current = null
  }, [working])

  async function show(file: File) {
    const processed = await processAvatar(file)
    // La vista previa recién cuando el procesado terminó: hay formatos que el navegador no sabe
    // dibujar tal como salen del teléfono, y prometerla antes dejaría un hueco.
    setPreview(URL.createObjectURL(processed))
    onPick(processed)
  }

  function pick(file: File) {
    const rejection = rejectionFor(file)
    if (rejection !== null) {
      onError(rejection)
      return
    }

    startProcessing(async () => {
      try {
        await show(file)
      } catch {
        onError('profile.errors.photo_failed')
      }
    })
  }

  function pickSuggested(suggested: string) {
    startFetching(async () => {
      try {
        await show(await downloadPhoto(suggested))
        focusAfter.current = 'pick'
      } catch {
        onError('profile.errors.google_photo_failed')
        focusAfter.current = 'suggestion'
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
          <Button
            ref={pickButton}
            variant="ghost"
            onClick={() => input.current?.click()}
            disabled={working}
          >
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

      {suggestedUrl !== null && shown === null ? (
        <PhotoSuggestion
          texts={texts.suggestion}
          url={suggestedUrl}
          displayName={displayName}
          loading={fetching}
          disabled={processing}
          onUse={() => pickSuggested(suggestedUrl)}
          buttonRef={suggestionButton}
        />
      ) : null}

      {error ? <ErrorText announce>{error}</ErrorText> : null}
    </div>
  )
}
