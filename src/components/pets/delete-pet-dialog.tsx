'use client'

import {
  DestructiveConfirmDialog,
  type DestructiveConfirmTexts,
} from '@/components/ui/destructive-confirm-dialog'
import { usePetDeletion } from '@/hooks/use-pet-deletion'

export type DeletePetTexts = DestructiveConfirmTexts & { offline: string; noResponse: string }

type Props = {
  petId: string
  returnPath: string
  /** Ya traducidos, con el nombre del animal. */
  texts: DeletePetTexts
  /** `ghost` en la card dada de baja, donde «Borrar» es lo único que queda. */
  triggerVariant?: 'ghost-danger' | 'ghost'
}

// Borrar un animal es para siempre, con sus fotos (FR-005): se confirma en un `Dialog`, y lo que no
// llegó se dice adentro, sin cerrarlo.
export function DeletePetDialog({ petId, returnPath, texts, triggerVariant }: Props) {
  const remove = usePetDeletion(petId, returnPath)
  return (
    <DestructiveConfirmDialog
      texts={texts}
      triggerVariant={triggerVariant}
      onConfirm={async () => {
        const failure = await remove()
        if (failure === null) return null
        return failure === 'offline' ? texts.offline : texts.noResponse
      }}
    />
  )
}
