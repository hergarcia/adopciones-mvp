'use client'

import { useState } from 'react'
import { Toast, ToastProvider } from '@/components/ui/toast'

type Props = {
  message: string
  closeLabel: string
  label: string
  regionLabel: string
}

// El aviso vive en la pantalla a la que se llega, no en el formulario que se deja: el formulario
// se desmonta con la navegación y el aviso se iba con él antes de poder leerse (docs/10
// §Componentes, `Toast`: cuatro segundos en pantalla).
export function SavedToast({ message, closeLabel, label, regionLabel }: Props) {
  const [open, setOpen] = useState(true)

  return (
    <ToastProvider label={label} regionLabel={regionLabel}>
      <Toast
        message={message}
        closeLabel={closeLabel}
        variant="success"
        open={open}
        onOpenChange={setOpen}
      />
    </ToastProvider>
  )
}
