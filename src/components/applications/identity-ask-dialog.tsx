'use client'

import { laterDialog } from '@/components/forms/later-dialog'
import type { LaterPart } from '@/components/ui/deferred-part'

export type IdentityAskTexts = {
  trigger: string
  title: string
  body: string
  confirm: string
  retry: string
  cancel: string
  close: string
  /** Lo que no llegó, adentro del `Dialog`. */
  failed: string
  /** La espera de los botones, y el aviso si no llegan. */
  part: LaterPart
}

export type IdentityAskTarget = { id: string; texts: IdentityAskTexts }

// Dialog y no Sheet: el pedido manda un correo y no se deshace. El botón, el título y lo que pasa
// salen con la pantalla; los botones y lo que pide llegan después (historias #316 y #318).
export const IdentityAskDialog = laterDialog<IdentityAskTarget>(() =>
  import('./identity-ask-body').then((module) => module.IdentityAskBody),
)
