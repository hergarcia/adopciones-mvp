'use client'

import { useEffect, useRef, useState } from 'react'
import type { ActionResult } from '@/actions/result'
import { shouldTrackStart, type FormDraft } from '@/lib/pets/draft'

export type DraftNotice = 'restored' | 'already_published' | null

type Options<F> = {
  /** La clave de `localStorage`: una por formulario, así no se pisan (FR-017 de la #205). */
  storageKey: string
  accountId: string
  empty: F
  enabled: boolean
  /** `false` cuando el formulario ya llega cargado: lo guardado antes no lo pisa. */
  restore?: boolean
  read: (raw: string, accountId: string, now: number) => FormDraft<F> | null
  checkAttempt: (attemptId: string) => Promise<ActionResult<{ published: boolean }>>
  /** El primer dato o la primera foto de un formulario vacío (FR-028 de la #53). */
  onStart: () => void
}

function removeDraft(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Sin almacenamiento no hay nada que borrar.
  }
}

// Lo escrito de una publicación nueva, en este navegador y atado a la cuenta (FR-024 de la #53).
// Cada carga es un intento nuevo: lo recuperado trae los datos y el comienzo de la carga, no el
// intento. Si el intento de lo guardado ya publicó —una respuesta perdida y después una recarga—,
// se descarta y se dice (spec #53, Edge Cases).
export function useFormDraft<F>({
  storageKey,
  accountId,
  empty,
  enabled,
  restore = true,
  read,
  checkAttempt,
  onStart,
}: Options<F>) {
  const [values, setValues] = useState(empty)
  const [notice, setNotice] = useState<DraftNotice>(null)
  const [ready, setReady] = useState(!enabled)
  const attemptId = useRef('')
  const startedAt = useRef<number | null>(null)
  const finished = useRef(false)
  // Las funciones de quien llama pueden cambiar en cada render; el efecto de montar corre una vez.
  const io = useRef({ read, checkAttempt })

  // Después de montar: el servidor no tiene `localStorage` ni tiene que inventar el intento.
  /* eslint-disable react/set-state-in-effect */
  useEffect(() => {
    attemptId.current = crypto.randomUUID()
    if (!enabled) return
    let draft: FormDraft<F> | null = null
    try {
      const raw = window.localStorage.getItem(storageKey)
      draft = raw === null || !restore ? null : io.current.read(raw, accountId, Date.now())
    } catch {
      draft = null
    }
    if (draft === null) {
      removeDraft(storageKey)
      setReady(true)
      return
    }
    const found = draft
    void io.current
      .checkAttempt(found.attemptId)
      .catch(() => null)
      .then((checked) => {
        if (checked?.ok && checked.data.published) {
          removeDraft(storageKey)
          setNotice('already_published')
        } else {
          startedAt.current = found.startedAt
          setValues(found.fields)
          setNotice('restored')
        }
        setReady(true)
      })
  }, [accountId, enabled, restore, storageKey])
  /* eslint-enable react/set-state-in-effect */

  useEffect(() => {
    if (!enabled || !ready || finished.current) return
    if (JSON.stringify(values) === JSON.stringify(empty)) return removeDraft(storageKey)
    const draft: FormDraft<F> = {
      v: 1,
      accountId,
      attemptId: attemptId.current,
      startedAt: startedAt.current ?? Date.now(),
      updatedAt: Date.now(),
      fields: values,
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(draft))
    } catch {
      // Sin almacenamiento el formulario sigue funcionando, solo no se acuerda.
    }
  }, [accountId, empty, enabled, ready, storageKey, values])

  function markStarted() {
    if (
      !enabled ||
      !shouldTrackStart({ startedAt: startedAt.current, restored: notice === 'restored' })
    ) {
      return
    }
    startedAt.current = Date.now()
    onStart()
  }

  return {
    values,
    setValues,
    notice,
    attemptId: () => attemptId.current,
    startedAt: () => startedAt.current,
    markStarted,
    startOver: () => {
      removeDraft(storageKey)
      startedAt.current = null
      setNotice(null)
      setValues(empty)
    },
    finish: () => {
      finished.current = true
      removeDraft(storageKey)
    },
  }
}
