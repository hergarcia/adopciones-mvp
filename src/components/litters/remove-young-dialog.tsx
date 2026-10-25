'use client'

import { countText, type CountForms } from '@/components/forms/character-count'
import { DestructiveConfirmDialog } from '@/components/ui/destructive-confirm-dialog'
import type { Removal } from '@/hooks/use-young-removal'

export type RemoveYoungTexts = {
  /** Con `{count}` en el plural: cuántas solicitudes se cierran. */
  close: { title: CountForms; body: CountForms; confirm: CountForms; cancel: string }
  remove: {
    title: string
    body: string
    confirm: string
    cancel: string
    offline: string
    noResponse: string
  }
  dismiss: string
}

type Props = {
  removal: Removal | null
  texts: RemoveYoungTexts
  /** Guardar igual, con las solicitudes que se cierran. */
  onSave: () => void
  /** Borrar la camada entera. Devuelve por qué no llegó, o null si salió bien. */
  onDelete: () => Promise<'offline' | 'no_response' | null>
  onCancel: () => void
}

// Lo que no se deshace al quitar crías (FR-019, FR-020), antes de guardar: «Se cierran 2
// solicitudes» o «Se borra la camada». Sobre `DestructiveConfirmDialog`, que no se cierra mientras
// la acción corre.
export function RemoveYoungDialog({ removal, texts, onSave, onDelete, onCancel }: Props) {
  const count = removal?.kind === 'close' ? removal.count : 0
  const deleting = removal?.kind === 'delete'
  const shown = deleting
    ? { ...texts.remove, trigger: texts.remove.confirm }
    : {
        title: countText(count, texts.close.title),
        body: countText(count, texts.close.body),
        confirm: countText(count, texts.close.confirm),
        trigger: countText(count, texts.close.confirm),
        cancel: texts.close.cancel,
      }

  return (
    <DestructiveConfirmDialog
      open={removal !== null}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
      texts={{ ...shown, close: texts.dismiss }}
      onConfirm={async () => {
        if (!deleting) {
          onSave()
          return null
        }
        const failure = await onDelete()
        if (failure === null) return null
        return failure === 'offline' ? texts.remove.offline : texts.remove.noResponse
      }}
    />
  )
}
