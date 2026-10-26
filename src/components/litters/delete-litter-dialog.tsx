'use client'

import type { DeletePetTexts } from '@/components/pets/delete-pet-dialog'
import { DestructiveConfirmDialog } from '@/components/ui/destructive-confirm-dialog'
import { useLitterDeletion } from '@/hooks/use-litter-deletion'

type Props = {
  litterId: string
  returnPath: string
  /** Ya traducidos, con el nombre de la camada y cuántas solicitudes se cierran (FR-035). */
  texts: DeletePetTexts
  triggerVariant?: 'ghost-danger' | 'ghost'
}

// Borrar la camada entera es para siempre, con sus crías y sus fotos (FR-034, FR-035): se confirma
// diciendo cuántas solicitudes se cierran, y lo que no llegó se dice adentro, sin cerrarlo.
export function DeleteLitterDialog({ litterId, returnPath, texts, triggerVariant }: Props) {
  const remove = useLitterDeletion(litterId, returnPath)
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
