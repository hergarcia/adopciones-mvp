'use client'

import { DestructiveConfirmDialog } from '@/components/ui/destructive-confirm-dialog'
import { useYoungDeletion } from '@/hooks/use-young-deletion'
import type { RemoveYoungTexts } from './remove-young-texts'

type Props = {
  petId: string
  returnPath: string
  /** Ya traducidos, con su nombre, cuántas solicitudes se cierran y si se va la camada. */
  texts: RemoveYoungTexts
}

// En tinta, como «Borrar» en `MyLitterActions`: el acento queda para «Borrar la camada» y el botón
// de adentro. Lo que no llegó se dice adentro, sin cerrar la confirmación.
export function RemoveYoungAction({ petId, returnPath, texts }: Props) {
  const remove = useYoungDeletion(petId, returnPath)
  return (
    <DestructiveConfirmDialog
      texts={texts}
      triggerVariant="ghost"
      onConfirm={async (close) => {
        const failure = await remove(close)
        if (failure === null) return null
        if (failure === 'taken_down') return texts.takenDown
        return failure === 'offline' ? texts.offline : texts.noResponse
      }}
    />
  )
}
