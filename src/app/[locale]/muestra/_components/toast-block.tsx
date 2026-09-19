'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Toast, ToastProvider, type ToastVariant } from '@/components/ui/toast'
import { Block } from './block'

// La única hoja cliente de la muestra: el aviso necesita estado. Recibe los textos ya traducidos
// por props: al navegador no le baja `messages/es.json` (constitución §VII).
type Labels = {
  title: string
  successOpen: string
  errorOpen: string
  success: string
  error: string
  close: string
  announce: string
  region: string
}

type Props = {
  labels: Labels
}

export function ToastBlock({ labels }: Props) {
  const [toast, setToast] = useState<{ variant: ToastVariant; message: string } | null>(null)

  return (
    <ToastProvider label={labels.announce} regionLabel={labels.region}>
      <Block title={labels.title}>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => setToast({ variant: 'success', message: labels.success })}
          >
            {labels.successOpen}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setToast({ variant: 'error', message: labels.error })}
          >
            {labels.errorOpen}
          </Button>
        </div>
      </Block>

      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          closeLabel={labels.close}
          open
          onOpenChange={(open) => {
            if (!open) setToast(null)
          }}
        />
      ) : null}
    </ToastProvider>
  )
}
