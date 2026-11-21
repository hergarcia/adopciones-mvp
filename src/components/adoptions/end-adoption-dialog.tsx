'use client'

import { laterDialog } from '@/components/forms/later-dialog'
import type { LaterPart } from '@/components/ui/deferred-part'

export type EndAdoptionTexts = {
  /** «¿Volver a publicar a Tobi?». */
  title: string
  /** «La adopción con Ana termina: ninguna de las dos va a ver más el teléfono de la otra.». */
  body: string
  confirm: string
  cancel: string
  close: string
  /** La espera de los botones, y el aviso si no llegan. */
  part: LaterPart
}

// Volver a publicar un adoptado a una persona termina su adopción y el teléfono deja de verse para
// las dos (FR-031): se confirma antes; cancelar no cambia nada. `onConfirm` corre «Volver a publicar»
// con el flujo de siempre, que dice cómo terminó (#59). El botón, el título y lo que pasa salen con la
// pantalla; los botones de adentro llegan después (historia #316).
export const EndAdoptionDialog = laterDialog<{ texts: EndAdoptionTexts; onConfirm: () => void }>(
  () => import('./end-adoption-body').then((module) => module.EndAdoptionBody),
)
