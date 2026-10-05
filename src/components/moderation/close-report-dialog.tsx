'use client'

import { useState } from 'react'
import { ConfirmBody } from '@/components/forms/confirm-body'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

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
      <ConfirmBody
        body={texts.body}
        confirm={texts.confirm}
        cancel={texts.cancel}
        failure={failure}
        busy={busy}
        onConfirm={() => void confirm()}
        onCancel={() => setOpen(false)}
      />
    </Dialog>
  )
}
