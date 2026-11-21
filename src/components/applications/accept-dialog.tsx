'use client'

import { laterDialog } from '@/components/forms/later-dialog'
import type { LaterPart } from '@/components/ui/deferred-part'

export type AcceptTexts = {
  trigger: string
  title: string
  body: string
  confirm: string
  cancel: string
  close: string
  /** Por clave de `inbox.errors`. */
  errors: Record<string, string>
  /** La espera de los botones, y el aviso si no llegan. */
  part: LaterPart
}

export type AcceptTarget = {
  id: string
  /** Adónde va al aceptar: la misma solicitud con la oferta de «En proceso». */
  doneHref: string
  texts: AcceptTexts
}

// Aceptar da el teléfono de las dos y no se deshace en el sentido de lo ya visto, así que es un
// `Dialog` (FR-010). «Aceptar solicitud», el título y lo que pasa salen con la pantalla; los botones
// y lo que acepta llegan después, como en rechazar (historias #316 y #318): así el aviso de lo que
// no llega al tocar no suma código al abrir una solicitud.
export const AcceptDialog = laterDialog<AcceptTarget>(() =>
  import('./accept-body').then((module) => module.AcceptBody),
)
