'use client'

import { Input } from '@/components/ui/input'
import { Sheet } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  /** El enlace, o el texto entero para el grupo con `multiline`. */
  value: string
  multiline?: boolean
  onClose: () => void
  /** Ya traducidos. */
  texts: { title: string; body: string; fieldLabel: string; close: string }
}

// Lo que hay que copiar a mano, cuando el navegador no deja copiar (Edge Case «Compartir sin poder
// copiar»). Se baja solo si hace falta: casi nunca pasa, y el `Sheet` pesa. Radix pone el foco en el
// campo, que es lo primero que se puede tocar, y al enfocarlo queda seleccionado.
export function ShareManualSheet({ value, multiline = false, onClose, texts }: Props) {
  const select = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    event.currentTarget.select()
  return (
    <Sheet
      title={texts.title}
      closeLabel={texts.close}
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <p className="text-base text-ink">{texts.body}</p>
      {multiline ? (
        <Textarea
          readOnly
          value={value}
          rows={10}
          aria-label={texts.fieldLabel}
          onFocus={select}
          className="w-full"
        />
      ) : (
        <Input
          readOnly
          value={value}
          aria-label={texts.fieldLabel}
          onFocus={select}
          className="w-full"
        />
      )}
    </Sheet>
  )
}
