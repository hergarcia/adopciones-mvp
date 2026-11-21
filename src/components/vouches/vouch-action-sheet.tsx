'use client'

import { Button } from '@/components/ui/button'
import { useVouchFlow } from '@/hooks/use-vouch-flow'
import type { VouchOrigin } from '@/lib/vouches/types'
import { VouchSheet, type VouchSheetTexts } from './vouch-sheet'

export type VouchActionProps = {
  verb: 'give' | 'withdraw'
  publicId: string
  /** La pantalla que se vuelve a dibujar con el resultado. */
  returnPath: string
  trigger: { label: string; variant: 'tirita' | 'secondary' | 'ghost' }
  texts: VouchSheetTexts
  /** Desde dónde se da el aval, para la medición; el perfil si no se dice. */
  origin?: VouchOrigin
}

// El botón de avalar o retirar con su confirmación y lo que pasa al confirmar.
export function VouchActionSheet({
  verb,
  publicId,
  returnPath,
  trigger,
  texts,
  origin,
}: VouchActionProps) {
  const flow = useVouchFlow(returnPath, origin)
  return (
    <VouchSheet
      texts={texts}
      trigger={
        // La tirita solo está en el perfil público, que es pared: desde 768 mide lo que su texto
        // (docs/10 §Pantallas anchas).
        <Button
          variant={trigger.variant}
          size={trigger.variant === 'tirita' ? 'lg' : 'md'}
          className={trigger.variant === 'tirita' ? 'md:w-auto' : undefined}
        >
          {trigger.label}
        </Button>
      }
      onConfirm={(close) => flow[verb](publicId, close)}
    />
  )
}
