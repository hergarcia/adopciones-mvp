'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { ACCEPTED_TYPES } from '@/lib/profile/avatar'
import { identityPhotoRejection } from '@/lib/profile/identity-photo'
import { processIdentityPhoto } from '@/lib/profile/identity-photo-processing'
import { DocumentFrame } from './document-frame'

export type IdentityPhotoFieldTexts = {
  title: string
  hint: string
  take: string
  choose: string
  change: string
  alt: string
}

type Props = {
  texts: IdentityPhotoFieldTexts
  /** Por clave de `identity.errors`: tipo, tamaño, no se pudo procesar. */
  errors: Record<string, string>
  name: 'front' | 'selfie'
  /** La cámara de atrás para la cédula, la de adelante para la selfie. */
  capture: 'environment' | 'user'
  onChange: (file: File | null) => void
  onBusyChange: (busy: boolean) => void
  disabled?: boolean
  /** Lo que va entre el título y el hueco: el ejemplo de la selfie. */
  children?: React.ReactNode
}

// Sacar la foto en el momento o elegirla, procesarla y verla antes de enviar (FR-005, FR-007). Una
// foto rechazada no reemplaza a la que ya estaba (US1-AS7). Donde no hay cámara, «Sacar foto» abre
// los archivos: lo decide el navegador.
export function IdentityPhotoField({
  texts,
  errors,
  name,
  capture,
  onChange,
  onBusyChange,
  disabled = false,
  children,
}: Props) {
  const camera = useRef<HTMLInputElement>(null)
  const files = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, startProcessing] = useTransition()
  const errorId = useId()

  useEffect(() => onBusyChange(processing), [processing, onBusyChange])
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview])

  function pick(file: File) {
    setError(null)
    const rejection = identityPhotoRejection(file)
    if (rejection !== null) {
      setError(errors[rejection] ?? null)
      return
    }
    startProcessing(async () => {
      try {
        const processed = await processIdentityPhoto(file, name)
        setPreview(URL.createObjectURL(processed))
        onChange(processed)
      } catch {
        setError(errors['identity.errors.photo_failed'] ?? null)
      }
    })
  }

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
    // Dentro de la grilla de dos fotos, cada parte ocupa su fila —título, guía, hueco, pista,
    // error—, así los huecos de las dos quedan alineados. La guía vacía solo existe ahí.
    <section
      className="flex flex-col gap-3 md:row-span-5 md:grid md:grid-rows-subgrid"
      aria-describedby={error ? errorId : undefined}
    >
      <h2 className="text-lg font-bold text-ink">{texts.title}</h2>
      <div className="empty:hidden md:empty:block">{children}</div>

      {processing ? (
        <DocumentFrame state="loading" />
      ) : preview ? (
        <div className="flex flex-col items-start gap-1">
          <DocumentFrame state="image" src={preview} alt={texts.alt} />
          <Button variant="ghost" onClick={() => files.current?.click()} disabled={busy}>
            {texts.change}
          </Button>
        </div>
      ) : (
        <DocumentFrame
          state="slot"
          className="flex-wrap content-center items-center justify-center gap-3"
        >
          <Button variant="secondary" onClick={() => camera.current?.click()} disabled={busy}>
            {texts.take}
          </Button>
          <Button variant="secondary" onClick={() => files.current?.click()} disabled={busy}>
            {texts.choose}
          </Button>
        </DocumentFrame>
      )}

      <p className="text-sm text-ink-muted">{texts.hint}</p>
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
