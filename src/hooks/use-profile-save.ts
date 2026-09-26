'use client'

import { useRef, useState, useTransition } from 'react'
import { saveProfile } from '@/actions/profile'
import {
  SAVE_DEADLINE_MS,
  classifySaveFailure,
  type NoticeReason,
  type SaveOutcome,
  type SavedProfile,
} from '@/lib/profile/save-failure'

type Options = {
  onSaved: (data: SavedProfile) => void
  /** Un rechazo de los datos, con su clave de i18n: va donde iba hasta ahora, no al aviso. */
  onInvalid: (error: string) => void
}

export type SaveNotice = { reason: NoticeReason; attempt: number }

// Una Server Action no se puede cancelar: el plazo no aborta el pedido, deja de esperarlo.
async function withDeadline(pending: ReturnType<typeof saveProfile>): Promise<SaveOutcome> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<SaveOutcome>((resolve) => {
    timer = setTimeout(() => resolve({ kind: 'timeout' }), SAVE_DEADLINE_MS)
  })
  try {
    return await Promise.race([
      pending.then((result): SaveOutcome => ({ kind: 'result', result })),
      deadline,
    ])
  } catch {
    // Sin red, la llamada rechaza. Sin este catch el rechazo sube al límite de error y la pantalla
    // se reemplaza por «Algo se rompió», que es lo que borraba lo escrito.
    return { kind: 'threw' }
  } finally {
    clearTimeout(timer)
  }
}

// El guardado del perfil, envuelto para que uno que no llega deje un aviso en vez de romper la
// pantalla. Cada intento lleva un número: la respuesta de uno viejo que llega tarde no cambia nada
// (FR-009), porque podría sacar a la persona de un formulario que siguió editando.
export function useProfileSave({ onSaved, onInvalid }: Options) {
  const [notice, setNotice] = useState<SaveNotice | null>(null)
  const [pending, startTransition] = useTransition()
  const lastAttempt = useRef(0)

  function save(form: FormData) {
    lastAttempt.current += 1
    const attempt = lastAttempt.current

    startTransition(async () => {
      // `onLine === false` es confiable: el dispositivo sabe que no tiene red, y no hace falta
      // esperar a que el pedido falle para decirlo.
      const outcome: SaveOutcome = navigator.onLine
        ? await withDeadline(saveProfile(form))
        : { kind: 'threw' }
      if (attempt !== lastAttempt.current) return

      const verdict = classifySaveFailure({ online: navigator.onLine, outcome })
      if (verdict.kind === 'notice') {
        setNotice({ reason: verdict.reason, attempt })
        return
      }
      setNotice(null)
      if (verdict.kind === 'saved') onSaved(verdict.data)
      else onInvalid(verdict.error)
    })
  }

  return { save, pending, notice }
}
