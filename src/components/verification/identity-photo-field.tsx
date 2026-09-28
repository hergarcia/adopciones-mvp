'use client'

import { useId, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { useIdentityPhoto } from '@/hooks/use-identity-photo'
import { ACCEPTED_TYPES } from '@/lib/profile/avatar'
import type { IdentityPhotoKind } from '@/lib/verification/identity'
import { DocumentFrame } from './document-frame'
import { PhotoExample } from './photo-example'

export type IdentityPhotoFieldTexts = {
  title: string
  /** Cómo sacarla para que se lea, al lado del dibujo y antes de los botones. */
  example: string
  take: string
  choose: string
  change: string
  alt: string
}

type Props = {
  texts: IdentityPhotoFieldTexts
  /** Por clave de `identity.errors`: tipo, tamaño, no se pudo procesar. */
  errors: Record<string, string>
  kind: IdentityPhotoKind
  /** La cámara de atrás para la cédula, la de adelante para la selfie. */
  capture: 'environment' | 'user'
  onChange: (file: File | null) => void
  onBusyChange: (busy: boolean) => void
  disabled?: boolean
}

// Sacar la foto en el momento o elegirla y verla antes de enviar (FR-005). Cómo sacarla va antes de
// los botones, que es cuando sirve. «Sacar foto» aparece solo donde el puntero es el dedo: con mouse,
// el navegador ignora `capture` y abriría los archivos igual que «Elegir foto». Es CSS y no
// JavaScript para que el servidor pinte lo mismo que el teléfono.
export function IdentityPhotoField({
  texts,
  errors,
  kind,
  capture,
  onChange,
  onBusyChange,
  disabled = false,
}: Props) {
  const camera = useRef<HTMLInputElement>(null)
  const files = useRef<HTMLInputElement>(null)
  // Mientras procesa, el botón que se tocó se desmonta con su hueco: el foco vuelve a «Cambiar
  // foto» si salió, a «Elegir foto» si no.
  const chooseButton = useRef<HTMLButtonElement>(null)
  const changeButton = useRef<HTMLButtonElement>(null)
  const { preview, error, processing, pick } = useIdentityPhoto({
    kind,
    errors,
    onChange,
    onBusyChange,
    focusAfter: () => changeButton.current ?? chooseButton.current,
  })
  const titleId = useId()
  const errorId = useId()
  // Cada botón dice de qué foto es y, si la hay, el error: las dos fotos tienen los mismos botones.
  const describedBy = error ? `${titleId} ${errorId}` : titleId

  const input = (ref: React.RefObject<HTMLInputElement | null>, withCapture: boolean) => (
    <input
      ref={ref}
      type="file"
      accept={ACCEPTED_TYPES.join(',')}
      {...(withCapture ? { capture } : {})}
      className="sr-only"
      tabIndex={-1}
      aria-hidden
      onChange={(event) => {
        const file = event.target.files?.[0]
        if (file) pick(file)
        event.target.value = ''
      }}
    />
  )

  const busy = disabled || processing

  return (
    // Dentro de la grilla de dos fotos, cada parte ocupa su fila —título, cómo sacarla, hueco,
    // error—, así los huecos de las dos quedan alineados.
    <section
      className="flex flex-col gap-3 md:row-span-4 md:grid md:grid-rows-subgrid"
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className="text-lg font-bold text-ink">
        {texts.title}
      </h2>
      <PhotoExample kind={kind} description={texts.example} compact={preview !== null} />

      {/* El marco va siempre envuelto: con «Cambiar foto» abajo, la fila de esta foto es más alta
          que la de la otra, y un marco 4:3 estirado a ese alto se ensancharía fuera de su columna. */}
      <div className="flex flex-col items-start gap-1">
        {processing ? (
          <DocumentFrame state="loading" />
        ) : preview ? (
          <>
            <DocumentFrame state="image" src={preview} alt={texts.alt} />
            <Button
              ref={changeButton}
              variant="ghost"
              onClick={() => files.current?.click()}
              disabled={busy}
              aria-describedby={describedBy}
            >
              {texts.change}
            </Button>
          </>
        ) : (
          <DocumentFrame
            state="slot"
            className="flex-wrap content-center items-center justify-center gap-3"
          >
            <Button
              variant="secondary"
              className="hidden pointer-coarse:inline-flex"
              onClick={() => camera.current?.click()}
              disabled={busy}
              aria-describedby={describedBy}
            >
              {texts.take}
            </Button>
            <Button
              ref={chooseButton}
              variant="secondary"
              onClick={() => files.current?.click()}
              disabled={busy}
              aria-describedby={describedBy}
            >
              {texts.choose}
            </Button>
          </DocumentFrame>
        )}
      </div>

      {error ? (
        <ErrorText id={errorId} announce>
          {error}
        </ErrorText>
      ) : null}

      {input(camera, true)}
      {input(files, false)}
    </section>
  )
}
