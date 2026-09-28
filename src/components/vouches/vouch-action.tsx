'use client'

import { Button } from '@/components/ui/button'
import { useVouchFlow } from '@/hooks/use-vouch-flow'
import { VouchSheet, type VouchSheetTexts } from './vouch-sheet'

type Props = {
  verb: 'give' | 'withdraw'
  publicId: string
  /** La pantalla que se vuelve a dibujar con el resultado. */
  returnPath: string
  trigger: { label: string; variant: 'tirita' | 'ghost' }
  texts: VouchSheetTexts
}

// La hoja cliente del lugar de avalar y de una fila de «Mis avales»: el botón y su confirmación.
export function VouchAction({ verb, publicId, returnPath, trigger, texts }: Props) {
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
