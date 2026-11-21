'use client'

import type { LaterDialogControl } from '@/components/forms/later-dialog'
import { DestructiveConfirmContent } from '@/components/ui/destructive-confirm-dialog'
import { useYoungDeletion } from '@/hooks/use-young-deletion'
import type { RemoveYoungTexts } from './remove-young-texts'

type Props = LaterDialogControl & { petId: string; returnPath: string; texts: RemoveYoungTexts }

// Lo que no llegó se dice adentro, sin cerrar la confirmación.
export function RemoveYoungBody({ petId, returnPath, texts, close, onPending }: Props) {
  const remove = useYoungDeletion(petId, returnPath)
  return (
    <DestructiveConfirmContent
      texts={texts}
      close={close}
      onPending={onPending}
      onConfirm={async (done) => {
        const failure = await remove(done)
        if (failure === null) return null
        if (failure === 'taken_down') return texts.takenDown
        return failure === 'offline' ? texts.offline : texts.noResponse
      }}
    />
  )
}
