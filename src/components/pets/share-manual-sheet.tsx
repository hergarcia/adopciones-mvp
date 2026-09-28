'use client'

import { Input } from '@/components/ui/input'
import { Sheet } from '@/components/ui/sheet'

type Props = {
  url: string
  onClose: () => void
  /** Ya traducidos. */
  texts: { title: string; body: string; linkLabel: string; close: string }
}

// El enlace para copiar a mano, cuando el navegador no deja copiar (Edge Case «Compartir sin poder
// copiar»). Se baja solo si hace falta: casi nunca pasa, y el `Sheet` pesa. Radix pone el foco en el
// enlace, que es lo primero que se puede tocar, y al enfocarlo queda seleccionado.
export function ShareManualSheet({ url, onClose, texts }: Props) {
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
      <Input
        readOnly
        value={url}
        aria-label={texts.linkLabel}
        onFocus={(event) => event.currentTarget.select()}
        className="w-full"
      />
    </Sheet>
  )
}
