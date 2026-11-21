'use client'

import { useRef, useState } from 'react'
import { holdApplication, submitApplication } from '@/actions/applications'
import type { HoldResult } from '@/lib/applications/held-outcome'
import type { SubmitResult } from '@/lib/applications/submit-outcome'

export type SubmitPayload = Parameters<typeof submitApplication>[0]
/** Mandarla, o dejarla escrita mientras revisan la identidad (historia #289). */
export type SubmitMode = 'send' | 'hold'
export type FormResult = SubmitResult | HoldResult

const CONNECTION: FormResult = { ok: false, error: 'applications.errors.connection' }

// La tirita ocupada de punta a punta: un segundo toque mientras tanto no hace nada, y un envío que
// no llega por la conexión vuelve como tal, con todo escrito en pantalla (FR-031). Reintentar es
// el mismo toque con el mismo intento, así la base nunca guarda dos.
export function useApplicationSubmit(mode: SubmitMode = 'send') {
  const [busy, setBusy] = useState(false)
  const sending = useRef(false)

  async function submit(payload: SubmitPayload): Promise<FormResult | null> {
    if (sending.current) return null
    sending.current = true
    setBusy(true)
    try {
      const action = mode === 'hold' ? holdApplication : submitApplication
      return await action(payload).catch(() => CONNECTION)
    } finally {
      sending.current = false
      setBusy(false)
    }
  }

  return { busy, submit }
}
