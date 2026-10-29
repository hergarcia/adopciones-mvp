'use client'

import { useState } from 'react'
import { DestructiveConfirmDialog } from '@/components/ui/destructive-confirm-dialog'
import type { PetStatusFailure } from '@/hooks/use-pet-status'
import { deletionAnswerOf, type DeletionAnswer } from '@/lib/pets/deletion-reason'
import type { DeletePetTexts } from './delete-pet-dialog'
import { DeletionReasonField } from './deletion-reason-field'

type Props = {
  texts: DeletePetTexts
  triggerVariant?: 'ghost-danger' | 'ghost'
  /** Borra, con la respuesta solo si la confirmación preguntó; devuelve por qué no llegó. */
  remove: (reason?: DeletionAnswer) => Promise<PetStatusFailure | null>
}

// Borrar un animal o una camada para siempre: lo que no llegó se dice adentro, sin cerrar, con lo
// elegido intacto. Cerrar sin borrar lo olvida: al volver a abrir, ninguna opción viene elegida.
export function DeletionConfirmDialog({ texts, triggerVariant, remove }: Props) {
  const [selected, setSelected] = useState('')
  const reason = texts.reason ?? null
  return (
    <DestructiveConfirmDialog
      texts={texts}
      triggerVariant={triggerVariant}
      onOpenChange={(open) => (open ? undefined : setSelected(''))}
      onConfirm={async () => {
        const failure = await remove(reason === null ? undefined : deletionAnswerOf(selected))
        if (failure === null) return null
        return failure === 'offline' ? texts.offline : texts.noResponse
      }}
    >
      {reason === null
        ? undefined
        : (pending) => (
            <DeletionReasonField
              texts={reason}
              value={selected}
              onChange={setSelected}
              disabled={pending}
            />
          )}
    </DestructiveConfirmDialog>
  )
}
