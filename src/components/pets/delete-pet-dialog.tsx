'use client'

import { useState } from 'react'
import {
  DestructiveConfirmDialog,
  type DestructiveConfirmTexts,
} from '@/components/ui/destructive-confirm-dialog'
import { usePetDeletion } from '@/hooks/use-pet-deletion'
import { deletionAnswerOf } from '@/lib/pets/deletion-reason'
import { DeletionReasonField } from './deletion-reason-field'
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

// Borrar un animal es para siempre, con sus fotos (FR-005): se confirma en un `Dialog`, y lo que no
// llegó se dice adentro, sin cerrarlo, con lo elegido intacto. Cerrar sin borrar lo olvida: al
// volver a abrir, ninguna opción viene elegida.
export function DeletePetDialog({ petId, returnPath, texts, triggerVariant }: Props) {
  const remove = usePetDeletion(petId, returnPath)
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
