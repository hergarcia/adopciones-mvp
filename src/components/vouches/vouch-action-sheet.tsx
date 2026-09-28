'use client'

import { Button } from '@/components/ui/button'
import { useVouchFlow } from '@/hooks/use-vouch-flow'
import { VouchSheet, type VouchSheetTexts } from './vouch-sheet'

export type VouchActionProps = {
  verb: 'give' | 'withdraw'
  publicId: string
  /** La pantalla que se vuelve a dibujar con el resultado. */
  returnPath: string
  trigger: { label: string; variant: 'tirita' | 'ghost' }
  texts: VouchSheetTexts
}

// El botón de avalar o retirar con su confirmación y lo que pasa al confirmar.
export function VouchActionSheet({ verb, publicId, returnPath, trigger, texts }: VouchActionProps) {
  const flow = useVouchFlow(returnPath)
  return (
    <VouchSheet
      texts={texts}
      trigger={
        <Button variant={trigger.variant} size={trigger.variant === 'tirita' ? 'lg' : 'md'}>
          {trigger.label}
        </Button>
      }
      onConfirm={(close) => flow[verb](publicId, close)}
    />
  )
}
