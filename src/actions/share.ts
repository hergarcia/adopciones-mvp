'use server'

import { SHARE_ORIGINS, type ShareOrigin } from '@/lib/analytics/events'
import { track } from '@/lib/analytics/track'
import type { ActionResult } from './result'

function isShareOrigin(value: unknown): value is ShareOrigin {
  return SHARE_ORIGINS.some((origin) => origin === value)
}

// «Tocó "Compartir"» (FR-023). Una escritura de medición sin respuesta que alguien espere: nunca
// muestra un error, y lo que no está en la lista no se registra. Sin la cuenta ni el animal.
export async function trackShare(from: unknown): Promise<ActionResult<void>> {
  if (isShareOrigin(from)) await track('pet_share_tapped', { from })
  return { ok: true, data: undefined }
}
