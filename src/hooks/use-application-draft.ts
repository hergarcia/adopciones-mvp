'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { checkApplicationAttempt, trackApplicationMoment } from '@/actions/applications'
import {
  applicationDraftKey,
  readApplicationDraft,
  type ApplicationDraft,
} from '@/lib/applications/draft'
import { myApplicationPath } from '@/lib/applications/paths'
import type { Answers } from '@/lib/applications/questionnaire'

function removeDraft(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Sin almacenamiento no hay nada que borrar.
  }
}

function storedDraft(key: string, accountId: string): ApplicationDraft | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? null : readApplicationDraft(raw, accountId, Date.now())
  } catch {
    return null
  }
}

// Lo escrito en el cuestionario de un animal, en este navegador y atado a la cuenta (research R7):
// el borrador gana sobre las respuestas propuestas (FR-042), y trae su intento, así un reintento
// después de recargar no manda dos. Si ese intento ya había enviado —una respuesta perdida y
// después una recarga—, lleva a Mi solicitud.
export function useApplicationDraft(input: {
  code: string
  accountId: string
  initial: Answers
  proposed: boolean
}) {
  const { code, accountId, initial, proposed } = input
  const key = applicationDraftKey(code)
  const router = useRouter()
  const [answers, setAnswers] = useState(initial)
  const [restored, setRestored] = useState(false)
  const [ready, setReady] = useState(false)
  const attemptId = useRef('')
  const startedAt = useRef<number | null>(null)
  const finished = useRef(false)

  // Después de montar: el servidor no tiene `localStorage` ni tiene que inventar el intento.
  /* eslint-disable react/set-state-in-effect */
  useEffect(() => {
    attemptId.current = crypto.randomUUID()
    const draft = storedDraft(key, accountId)
    if (draft === null) {
      removeDraft(key)
      setReady(true)
      return
    }
    void checkApplicationAttempt(draft.attemptId)
      .catch(() => null)
      .then((checked) => {
        const sentId = checked?.ok ? checked.data.id : null
        if (sentId !== null) {
          removeDraft(key)
          router.replace(myApplicationPath(sentId))
          return
        }
        attemptId.current = draft.attemptId
        startedAt.current = draft.startedAt
        setAnswers(draft.answers)
        setRestored(true)
        setReady(true)
      })
  }, [key, accountId, router])
  /* eslint-enable react/set-state-in-effect */

  useEffect(() => {
    if (!ready || finished.current || startedAt.current === null) return
    const draft: ApplicationDraft = {
      v: 1,
      accountId,
      attemptId: attemptId.current,
      startedAt: startedAt.current,
      updatedAt: Date.now(),
      answers,
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(draft))
    } catch {
      // Sin almacenamiento el cuestionario sigue funcionando, solo no se acuerda.
    }
  }, [key, accountId, ready, answers])

  function change(next: Answers) {
    if (startedAt.current === null) {
      startedAt.current = Date.now()
      if (!restored) void trackApplicationMoment('started', { proposed }).catch(() => null)
    }
    setAnswers(next)
  }

  return {
    answers,
    change,
    ready,
    restored,
    attemptId: () => attemptId.current,
    startedAt: () => startedAt.current,
    startOver: () => {
      removeDraft(key)
      startedAt.current = null
      setRestored(false)
      setAnswers(initial)
    },
    finish: () => {
      finished.current = true
      removeDraft(key)
    },
  }
}
