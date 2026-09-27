'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { PetActionDetail } from '@/actions/pets'
import { petGatePath } from '@/lib/pets/paths'
import type { PetFieldErrors } from '@/lib/schemas/pet'
import type { SaveOutcome } from './use-pet-save'

export type Blocked = { kind: 'session' } | { kind: 'level'; gatePath: string }
export type Duplicate = NonNullable<PetActionDetail['duplicate']>
type Outcome = SaveOutcome | { kind: 'blocked' | 'empty' }

type Options = {
  texts: { offline: string; site: string; photosBlocked: string; photosRequired: string }
  returnTo: string
  /** El guardado llegó: a «Mis animales» con el aviso. */
  onSaved: () => void
  /** Los errores por campo que devolvió el servidor, para llevar el foco al primero. */
  onFieldErrors: (errors: PetFieldErrors) => void
}

// Qué le dice el formulario a la persona según cómo terminó el guardado: cada falla en su lugar
// —el campo, las fotos, arriba de la tirita o un aviso— y todo lo cargado sigue en pantalla
// (FR-021, FR-022, FR-023, FR-020a).
export function usePetFeedback({ texts, returnTo, onSaved, onFieldErrors }: Options) {
  const router = useRouter()
  const [photosError, setPhotosError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [changedElsewhere, setChangedElsewhere] = useState(false)
  const [blocked, setBlocked] = useState<Blocked | null>(null)
  const [duplicate, setDuplicate] = useState<Duplicate | null>(null)

  function apply(outcome: Outcome) {
    const detail = 'detail' in outcome ? outcome.detail : undefined
    switch (outcome.kind) {
      case 'ok':
        return onSaved()
      case 'offline':
        return setError(texts.offline)
      case 'session':
        return setBlocked({ kind: 'session' })
      case 'level':
        return setBlocked({ kind: 'level', gatePath: detail?.gatePath ?? petGatePath(returnTo) })
      case 'duplicate_name':
        return setDuplicate(detail?.duplicate ?? null)
      case 'invalid':
        return onFieldErrors(detail?.fields ?? {})
      case 'changed_elsewhere':
        return setChangedElsewhere(true)
      case 'not_found':
        return router.refresh()
      case 'blocked':
        return setPhotosError(texts.photosBlocked)
      case 'empty':
        return setPhotosError(texts.photosRequired)
      default:
        return setError(texts.site)
    }
  }

  return {
    photosError,
    setPhotosError,
    error,
    changedElsewhere,
    blocked,
    duplicate,
    apply,
    /** Antes de mandar de nuevo: lo que decía el intento anterior ya no vale. */
    clear: () => {
      setError(null)
      setDuplicate(null)
    },
    closeBlocked: () => setBlocked(null),
    closeDuplicate: () => setDuplicate(null),
  }
}
