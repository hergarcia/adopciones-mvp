'use client'

import type { DestructiveConfirmTexts } from '@/components/ui/destructive-confirm-dialog'
import { usePetDeletion } from '@/hooks/use-pet-deletion'
import { DeletionConfirmDialog } from './deletion-confirm-dialog'
import type { DeletionReasonTexts } from './deletion-reason-texts'

export type DeletePetTexts = DestructiveConfirmTexts & {
  offline: string
  noResponse: string
  /** «¿Por qué lo borrás?»; nulo o ausente donde no corresponde, como en un adoptado (#263). */
  reason?: DeletionReasonTexts | null
}

type Props = {
  petId: string
  returnPath: string
  /** Ya traducidos, con el nombre del animal. */
  texts: DeletePetTexts
  /** `ghost` en la card dada de baja, donde «Borrar» es lo único que queda. */
  triggerVariant?: 'ghost-danger' | 'ghost'
}

// Borrar un animal es para siempre, con sus fotos (FR-005).
export function DeletePetDialog({ petId, returnPath, texts, triggerVariant }: Props) {
  const remove = usePetDeletion(petId, returnPath)
  return <DeletionConfirmDialog texts={texts} triggerVariant={triggerVariant} remove={remove} />
}
