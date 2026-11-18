'use client'

import { useState } from 'react'
import { DestructiveConfirmContent } from '@/components/ui/destructive-confirm-dialog'
import type { PetStatusFailure } from '@/hooks/use-pet-status'
import { deletionAnswerOf, type DeletionAnswer } from '@/lib/pets/deletion-reason'
import type { LaterDialogControl } from '@/components/forms/later-dialog'
import type { DeletePetTexts } from './delete-pet-dialog'
import { DeletionReasonField } from './deletion-reason-field'

type Props = LaterDialogControl & {
  texts: DeletePetTexts
  /** Borra, con la respuesta solo si la confirmación preguntó; devuelve por qué no llegó. */
  remove: (reason?: DeletionAnswer) => Promise<PetStatusFailure | null>
}

// Lo de adentro de borrar un animal o una camada: lo que no llegó se dice adentro, sin cerrar, con lo
// elegido intacto.
export function DeletionConfirmBody({ texts, remove, close, onPending }: Props) {
  const [selected, setSelected] = useState('')
  const reason = texts.reason ?? null
  return (
    <DestructiveConfirmContent
      texts={texts}
      close={close}
      onPending={onPending}
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
    </DestructiveConfirmContent>
  )
}
