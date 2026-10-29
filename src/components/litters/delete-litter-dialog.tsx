'use client'

import type { DeletePetTexts } from '@/components/pets/delete-pet-dialog'
import { DeletionConfirmDialog } from '@/components/pets/deletion-confirm-dialog'
import { useLitterDeletion } from '@/hooks/use-litter-deletion'

type Props = {
  litterId: string
  returnPath: string
  /** Ya traducidos, con el nombre de la camada y cuántas solicitudes se cierran (FR-035). */
  texts: DeletePetTexts
  triggerVariant?: 'ghost-danger' | 'ghost'
}

// Borrar la camada entera es para siempre, con sus crías y sus fotos (FR-034, FR-035): se confirma
// diciendo cuántas solicitudes se cierran y, si queda una cría sin adoptar, pregunta por qué una sola
// vez por la camada (historia #263).
export function DeleteLitterDialog({ litterId, returnPath, texts, triggerVariant }: Props) {
  const remove = useLitterDeletion(litterId, returnPath)
  return <DeletionConfirmDialog texts={texts} triggerVariant={triggerVariant} remove={remove} />
}
