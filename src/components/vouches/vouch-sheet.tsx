'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { Sheet } from '@/components/ui/sheet'
import type { VouchFailure } from '@/hooks/use-vouch-flow'

export type VouchSheetTexts = {
  title: string
  body: string
  confirm: string
  cancel: string
  close: string
  /** Con el verbo del botón adentro: reintentar es tocarlo de nuevo. */
  offline: string
  noResponse: string
}

type Props = {
  trigger: React.ReactNode
  texts: VouchSheetTexts
  /** Hace la acción. Devuelve por qué no llegó, o nada si terminó (y cerró o navegó). */
  onConfirm: (close: () => void) => Promise<VouchFailure | null>
}

// La confirmación de avalar y de retirar: una acción secundaria, así que un `Sheet` y no un
// `Dialog`, que queda para lo que no se deshace (docs/10). Mientras corre no se cierra y el botón
// no admite un segundo toque; lo que no llegó se dice adentro (FR-014).
export function VouchSheet({ trigger, texts, onConfirm }: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<VouchFailure | null>(null)

  async function confirm() {
    setFailure(null)
    setBusy(true)
    const result = await onConfirm(() => setOpen(false))
    setBusy(false)
    setFailure(result)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (busy) return
        setFailure(null)
        setOpen(next)
      }}
      title={texts.title}
      closeLabel={texts.close}
      trigger={trigger}
    >
      <p className="text-base text-ink">{texts.body}</p>
      {failure === null ? null : (
        <div className="mt-2 w-full">
          <ErrorText announce>{failure === 'offline' ? texts.offline : texts.noResponse}</ErrorText>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={() => void confirm()} loading={busy}>
          {texts.confirm}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
          {texts.cancel}
        </Button>
      </div>
    </Sheet>
  )
}
