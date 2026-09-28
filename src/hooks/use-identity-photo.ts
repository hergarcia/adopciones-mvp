'use client'

import { useEffect, useState, useTransition } from 'react'
import { identityPhotoRejection } from '@/lib/profile/identity-photo'
import { processIdentityPhoto } from '@/lib/profile/identity-photo-processing'
import type { IdentityPhotoKind } from '@/lib/verification/identity'
import { useRefocusAfter } from './use-refocus-after'

type Options = {
  kind: IdentityPhotoKind
  /** Por clave de `identity.errors`: tipo, tamaño, no se pudo procesar. */
  errors: Record<string, string>
  onChange: (file: File | null) => void
  onBusyChange: (busy: boolean) => void
  /** A dónde vuelve el foco cuando termina de procesar. */
  focusAfter: () => HTMLElement | null
}

type IdentityPhoto = {
  preview: string | null
  error: string | null
  processing: boolean
  pick: (file: File) => void
}

// Una foto del pedido, de elegida a lista para enviar (FR-007): se revisa, se procesa y se muestra.
// Una foto rechazada no reemplaza a la que ya estaba (US1-AS7).
export function useIdentityPhoto({
  kind,
  errors,
  onChange,
  onBusyChange,
  focusAfter,
}: Options): IdentityPhoto {
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, startProcessing] = useTransition()
  const refocusAfterProcessing = useRefocusAfter(processing, focusAfter)

  useEffect(() => onBusyChange(processing), [processing, onBusyChange])
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview])

  function pick(file: File) {
    setError(null)
    const rejection = identityPhotoRejection(file)
    if (rejection !== null) {
      setError(errors[rejection] ?? null)
      return
    }
    refocusAfterProcessing()
    startProcessing(async () => {
      try {
        const processed = await processIdentityPhoto(file, kind)
        setPreview(URL.createObjectURL(processed))
        onChange(processed)
      } catch {
        setError(errors['identity.errors.photo_failed'] ?? null)
      }
    })
  }

  return { preview, error, processing, pick }
}
