'use client'

import { useRef, useState } from 'react'
import { submitApplication } from '@/actions/applications'
import type { SubmitResult } from '@/lib/applications/submit-outcome'

const CONNECTION: SubmitResult = { ok: false, error: 'applications.errors.connection' }

// La tirita ocupada de punta a punta: un segundo toque mientras tanto no hace nada, y un envío que
// no llega por la conexión vuelve como tal, con todo escrito en pantalla (FR-031). Reintentar es
// el mismo toque con el mismo intento, así la base nunca guarda dos.
export function useApplicationSubmit() {
  const [busy, setBusy] = useState(false)
  const sending = useRef(false)

  async function submit(
    payload: Parameters<typeof submitApplication>[0],
  ): Promise<SubmitResult | null> {
    if (sending.current) return null
    sending.current = true
    setBusy(true)
    try {
      return await submitApplication(payload).catch(() => CONNECTION)
    } finally {
      sending.current = false
      setBusy(false)
    }
  }

  return { busy, submit }
}
