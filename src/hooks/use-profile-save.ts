'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { reportProfileSaveFailures, saveProfile } from '@/actions/profile'
import type { SaveMoment } from '@/lib/analytics/events'
import {
  EMPTY_FAILURE_LOG,
  SAVE_DEADLINE_MS,
  classifySaveFailure,
  recordFailure,
  type FailureLog,
  type NoticeReason,
  type SaveOutcome,
  type SavedProfile,
} from '@/lib/profile/save-failure'
import { PROFILE_SAVE_REPORT_MAX } from '@/lib/schemas/profile-save-report'

type Options = {
  moment: SaveMoment
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

// Los fallos se anotan tarde: sin conexión no hay cómo mandarlos en el momento (FR-020). Se mandan
// cuando vuelve la red con la pantalla abierta y antes de cada intento; si el reporte no llega,
// quedan para la próxima. Un lote en camino no se vuelve a mandar.
function useFailureLog(moment: SaveMoment) {
  const log = useRef<FailureLog>(EMPTY_FAILURE_LOG)
  const reporting = useRef(false)

  const flush = useCallback(() => {
    const batch = log.current.pending.slice(0, PROFILE_SAVE_REPORT_MAX)
    if (reporting.current || batch.length === 0 || !navigator.onLine) return

    reporting.current = true
    reportProfileSaveFailures({ failures: batch })
      .then(() => {
        log.current = { ...log.current, pending: log.current.pending.slice(batch.length) }
      })
      .catch(() => {
        // Se queda en la cola: la próxima vez que haya red va de nuevo.
      })
      .finally(() => {
        reporting.current = false
      })
  }, [])

  useEffect(() => {
    window.addEventListener('online', flush)
    return () => window.removeEventListener('online', flush)
  }, [flush])

  return {
    flush,
    record: (reason: NoticeReason) => {
      log.current = recordFailure(log.current, reason, moment)
    },
    hadFailure: () => log.current.seen > 0,
  }
}

// El guardado del perfil, envuelto para que uno que no llega deje un aviso en vez de romper la
// pantalla. Cada intento lleva un número: la respuesta de uno viejo que llega tarde no cambia nada
// (FR-009), porque podría sacar a la persona de un formulario que siguió editando.
export function useProfileSave({ moment, onSaved, onInvalid }: Options) {
  const [notice, setNotice] = useState<SaveNotice | null>(null)
  const [pending, startTransition] = useTransition()
  const lastAttempt = useRef(0)
  const failures = useFailureLog(moment)

  function save(form: FormData) {
    lastAttempt.current += 1
    const attempt = lastAttempt.current
    failures.flush()
    if (failures.hadFailure()) form.set('recovered', 'true')

    startTransition(async () => {
      // `onLine === false` es confiable: el dispositivo sabe que no tiene red, y no hace falta
      // esperar a que el pedido falle para decirlo.
      const outcome: SaveOutcome = navigator.onLine
        ? await withDeadline(saveProfile(form))
        : { kind: 'threw' }
      if (attempt !== lastAttempt.current) return

      const verdict = classifySaveFailure({ online: navigator.onLine, outcome })
      if (verdict.kind === 'notice') {
        failures.record(verdict.reason)
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
