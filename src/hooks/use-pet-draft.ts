'use client'

import { useEffect, useRef, useState } from 'react'
import { checkPetAttempt, trackPetMoment } from '@/actions/pets'
import { PET_DRAFT_KEY } from '@/lib/drafts/account-drafts'
import { readPetDraft, shouldTrackStart, type PetDraft } from '@/lib/pets/draft'
import type { PetFormValues } from '@/lib/pets/types'

function removeDraft() {
  try {
    window.localStorage.removeItem(PET_DRAFT_KEY)
  } catch {
    // Sin almacenamiento no hay nada que borrar.
  }
}

function storedDraft(accountId: string): PetDraft | null {
  try {
    const raw = window.localStorage.getItem(PET_DRAFT_KEY)
    return raw === null ? null : readPetDraft(raw, accountId, Date.now())
  } catch {
    return null
  }
}

export type DraftNotice = 'restored' | 'already_published' | null

// Lo escrito de una publicación nueva, en este navegador y atado a la cuenta (FR-024). Cada carga
// es un intento nuevo: lo recuperado trae los datos y el comienzo de la carga, no el intento. Si el
// intento de lo guardado ya publicó —una respuesta perdida y después una recarga—, se descarta y
// se dice (spec, Edge Cases).
export function usePetDraft(accountId: string, empty: PetFormValues, enabled: boolean) {
  const [values, setValues] = useState(empty)
  const [notice, setNotice] = useState<DraftNotice>(null)
  const [ready, setReady] = useState(!enabled)
  const attemptId = useRef('')
  const startedAt = useRef<number | null>(null)
  const finished = useRef(false)

  // Después de montar: el servidor no tiene `localStorage` ni tiene que inventar el intento.
  /* eslint-disable react/set-state-in-effect */
  useEffect(() => {
    attemptId.current = crypto.randomUUID()
    if (!enabled) return
    const draft = storedDraft(accountId)
    if (draft === null) {
      removeDraft()
      setReady(true)
      return
    }
    void checkPetAttempt(draft.attemptId)
      .catch(() => null)
      .then((checked) => {
        if (checked?.ok && checked.data.published) {
          removeDraft()
          setNotice('already_published')
        } else {
          startedAt.current = draft.startedAt
          setValues(draft.fields)
          setNotice('restored')
        }
        setReady(true)
      })
  }, [accountId, enabled])
  /* eslint-enable react/set-state-in-effect */

  useEffect(() => {
    if (!enabled || !ready || finished.current) return
    if (JSON.stringify(values) === JSON.stringify(empty)) return removeDraft()
    const draft: PetDraft = {
      v: 1,
      accountId,
      attemptId: attemptId.current,
      startedAt: startedAt.current ?? Date.now(),
      updatedAt: Date.now(),
      fields: values,
    }
    try {
      window.localStorage.setItem(PET_DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // Sin almacenamiento el formulario sigue funcionando, solo no se acuerda.
    }
  }, [accountId, empty, enabled, ready, values])

  // El primer dato o la primera foto de un formulario vacío (FR-028).
  function markStarted() {
    if (
      !enabled ||
      !shouldTrackStart({ startedAt: startedAt.current, restored: notice === 'restored' })
    ) {
      return
    }
    startedAt.current = Date.now()
    void trackPetMoment('pet_publish_started')
  }

  return {
    values,
    setValues,
    notice,
    attemptId: () => attemptId.current,
    startedAt: () => startedAt.current,
    markStarted,
    startOver: () => {
      removeDraft()
      startedAt.current = null
      setNotice(null)
      setValues(empty)
    },
    finish: () => {
      finished.current = true
      removeDraft()
    },
  }
}
