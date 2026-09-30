'use client'

import {
  DestructiveConfirmDialog,
  type DestructiveConfirmTexts,
} from '@/components/ui/destructive-confirm-dialog'
import { useVouchFlow } from '@/hooks/use-vouch-flow'

export type RemoveVouchTexts = DestructiveConfirmTexts & { offline: string; noResponse: string }

type Props = { publicId: string; returnPath: string; texts: RemoveVouchTexts }

// Quitar un aval no se deshace —esa persona ya no puede volver a avalar—, así que es un `Dialog`. El
// disparador va en `ghost`: en una lista de avales el ceibo aparecería en cada fila, y va una vez
// por pantalla, adentro del diálogo (docs/10 §Color).
export function RemoveVouchDialog({ publicId, returnPath, texts }: Props) {
  const flow = useVouchFlow(returnPath)

  async function remove(close: () => void): Promise<string | null> {
    const failure = await flow.remove(publicId, close)
    if (failure === null) return null
    return failure === 'offline' ? texts.offline : texts.noResponse
  }

  return <DestructiveConfirmDialog texts={texts} onConfirm={remove} triggerVariant="ghost" />
}
