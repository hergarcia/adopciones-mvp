'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { Skeleton } from '@/components/ui/skeleton'
import { ACCEPTED_TYPES } from '@/lib/profile/avatar'
import { identityPhotoRejection } from '@/lib/profile/identity-photo'
import { processIdentityPhoto } from '@/lib/profile/identity-photo-processing'

export type IdentityPhotoFieldTexts = {
  title: string
  hint: string
  take: string
  choose: string
  change: string
  alt: string
  /** Por clave de `identity.errors`: tipo, tamaño, no se pudo procesar. */
  errors: Record<string, string>
}

type Props = {
  texts: IdentityPhotoFieldTexts
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
      setError(texts.errors[rejection] ?? null)
      return
    }
    startProcessing(async () => {
      try {
        const processed = await processIdentityPhoto(file, name)
        setPreview(URL.createObjectURL(processed))
        onChange(processed)
      } catch {
        setError(texts.errors['identity.errors.photo_failed'] ?? null)
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
    <section className="flex flex-col gap-3" aria-describedby={error ? errorId : undefined}>
      <h2 className="text-lg font-bold text-ink">{texts.title}</h2>
      {children}

      {processing ? (
        <Skeleton className="aspect-[4/3] w-full" />
      ) : preview ? (
        <div className="flex flex-col items-start gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- una vista previa local, sin optimizar */}
          <img
            src={preview}
            alt={texts.alt}
            className="aspect-[4/3] w-full border-2 border-ink bg-surface object-contain"
          />
          <Button variant="ghost" onClick={() => files.current?.click()} disabled={busy}>
            {texts.change}
          </Button>
        </div>
      ) : (
        <div className="flex aspect-[4/3] w-full flex-wrap content-center items-center justify-center gap-3 border-2 border-dashed border-line bg-surface p-4">
          <Button variant="secondary" onClick={() => camera.current?.click()} disabled={busy}>
            {texts.take}
          </Button>
          <Button variant="secondary" onClick={() => files.current?.click()} disabled={busy}>
            {texts.choose}
          </Button>
        </div>
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
