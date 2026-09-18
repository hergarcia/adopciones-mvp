'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Sheet } from '@/components/ui/sheet'
import { Toast, ToastProvider, type ToastVariant } from '@/components/ui/toast'
import { Block } from './block'

// La única hoja cliente de la muestra: el aviso necesita estado. Recibe todos los textos ya
// traducidos por props, porque no hay NextIntlClientProvider a propósito (constitución §VII).
type Labels = {
  sheet: string
  sheetBottom: string
  sheetSide: string
  sheetTitle: string
  sheetClose: string
  dialog: string
  dialogOpen: string
  dialogTitle: string
  dialogBody: string
  dialogConfirm: string
  dialogCancel: string
  toast: string
  toastSuccessOpen: string
  toastErrorOpen: string
  toastSuccess: string
  toastError: string
  toastClose: string
}

type Props = {
  labels: Labels
}

export function OverlayTriggers({ labels }: Props) {
  const [toast, setToast] = useState<{ variant: ToastVariant; message: string } | null>(null)

  return (
    <ToastProvider>
      <Block title={labels.sheet}>
        <div className="flex flex-wrap gap-2">
          <Sheet
            side="bottom"
            title={labels.sheetTitle}
            closeLabel={labels.sheetClose}
            trigger={<Button variant="secondary">{labels.sheetBottom}</Button>}
          >
            <Button variant="ghost">{labels.dialogCancel}</Button>
          </Sheet>
          <Sheet
            side="side"
            title={labels.sheetTitle}
            closeLabel={labels.sheetClose}
            trigger={<Button variant="secondary">{labels.sheetSide}</Button>}
          >
            <Button variant="ghost">{labels.dialogCancel}</Button>
          </Sheet>
        </div>
      </Block>

      <Block title={labels.dialog}>
        <div className="flex flex-wrap gap-2">
          <Dialog
            title={labels.dialogTitle}
            description={labels.dialogBody}
            closeLabel={labels.sheetClose}
            trigger={<Button variant="secondary">{labels.dialogOpen}</Button>}
          >
            <Button variant="secondary">{labels.dialogCancel}</Button>
            <Button variant="danger">{labels.dialogConfirm}</Button>
          </Dialog>
        </div>
      </Block>

      <Block title={labels.toast}>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => setToast({ variant: 'success', message: labels.toastSuccess })}
          >
            {labels.toastSuccessOpen}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setToast({ variant: 'error', message: labels.toastError })}
          >
            {labels.toastErrorOpen}
          </Button>
        </div>
      </Block>

      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          closeLabel={labels.toastClose}
          open
          onOpenChange={(open) => {
            if (!open) setToast(null)
          }}
        />
      ) : null}
    </ToastProvider>
  )
}
