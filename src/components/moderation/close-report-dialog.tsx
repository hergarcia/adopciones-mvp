'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { ErrorText } from '@/components/ui/error-text'

export type CloseReportTexts = {
  trigger: string
  title: string
  body: string
  confirm: string
  cancel: string
  close: string
}

type Props = {
  texts: CloseReportTexts
  busy: boolean
  disabled: boolean
  /** Lo que no llegó, adentro: reintentar es tocar «Cerrar sin medidas» de nuevo. */
  failure: string | null
  /** Devuelve si el diálogo ya no tiene nada que hacer (se cerró, o el reporte cambió). */
  onConfirm: () => Promise<boolean>
}

// Cerrar un reporte no se deshace, así que es un `Dialog` (docs/10 reserva el `Dialog` para lo
// irreversible). Quieto · haciendo · error, con el error adentro y sin cerrarse mientras corre.
export function CloseReportDialog({ texts, busy, disabled, failure, onConfirm }: Props) {
  const [open, setOpen] = useState(false)

  async function confirm() {
    if (await onConfirm()) setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (busy ? undefined : setOpen(next))}
      title={texts.title}
      closeLabel={texts.close}
      trigger={
        <Button variant="secondary" disabled={disabled}>
          {texts.trigger}
        </Button>
      }
    >
      <p className="text-base text-ink">{texts.body}</p>
      {failure === null ? null : (
        <div className="mt-3 w-full">
          <ErrorText announce>{failure}</ErrorText>
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button variant="secondary" loading={busy} onClick={() => void confirm()}>
          {texts.confirm}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
          {texts.cancel}
        </Button>
      </div>
    </Dialog>
  )
}
