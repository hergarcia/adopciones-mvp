'use client'

import { useState } from 'react'
import { Toast, ToastProvider } from '@/components/ui/toast'
import { useDropFlags } from '@/hooks/use-drop-flags'

type Props = {
  message: string
  closeLabel: string
  label: string
  regionLabel: string
  /** Yerba si salió bien, ceibo si no: cancelar también puede fallar. */
  variant?: 'success' | 'error'
}

// El aviso vive en la pantalla a la que se llega, no en el formulario que se deja: el formulario
// se desmonta con la navegación y el aviso se iba con él antes de poder leerse (docs/10
// §Componentes, `Toast`: cuatro segundos en pantalla).
export function SavedToast({
  message,
  closeLabel,
  label,
  regionLabel,
  variant = 'success',
}: Props) {
  const [open, setOpen] = useState(true)

  useDropFlags()

  return (
    <ToastProvider label={label} regionLabel={regionLabel}>
      <Toast
        message={message}
        closeLabel={closeLabel}
        variant={variant}
        open={open}
        onOpenChange={setOpen}
      />
    </ToastProvider>
  )
}
