'use client'

import { useEffect } from 'react'
import { reportScreenFailure } from '@/actions/errors'

/** Lo que recibe un límite de error de Next: con `digest`, la falla pasó por el servidor. */
export type BoundaryError = Error & { digest?: string }

// No dibuja nada. Con `digest`, el servidor ya la avisó desde `onRequestError`; sin él, nació en el
// navegador y solo esto la cuenta (research R10 vía 4). Si el aviso no sale, se pierde: la pantalla
// de error ya está a la vista y no lo espera (FR-034).
export function ReportClientFailure({ error }: { error: BoundaryError }) {
  useEffect(() => {
    if (error.digest !== undefined) return
    void reportScreenFailure({ path: window.location.pathname, name: error.name }).catch(
      () => undefined,
    )
  }, [error])
  return null
}
