'use client'

import { laterDialog } from '@/components/forms/later-dialog'
import type { LaterPart } from '@/components/ui/deferred-part'
import type { DestructiveConfirmTexts } from '@/components/ui/destructive-confirm-dialog'
import type { DeletionReasonTexts } from './deletion-reason-texts'

export type DeletePetTexts = DestructiveConfirmTexts & {
  offline: string
  noResponse: string
  /** «¿Por qué lo borrás?»; nulo o ausente donde no corresponde, como en un adoptado (#263). */
  reason?: DeletionReasonTexts | null
  /** La espera de la pregunta y los botones, y el aviso si no llegan. */
  part: LaterPart
}

/** Lo que borra: un animal, una camada o una cría. */
export type DeletionTarget = { id: string; returnPath: string; texts: DeletePetTexts }

// Borrar un animal es para siempre, con sus fotos (FR-005). «Borrar» y el título salen con la
// pantalla; la pregunta, los botones y lo que borra pesaban en cada «Mis animales» y llegan después
// (historias #304 y #316).
export const DeletePetDialog = laterDialog<DeletionTarget>(() =>
  import('./delete-pet-body').then((module) => module.DeletePetBody),
)
