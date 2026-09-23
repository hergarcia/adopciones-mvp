'use client'

import { useEffect, useState } from 'react'
import { Toast, ToastProvider } from '@/components/ui/toast'

type Props = {
  message: string
  closeLabel: string
  label: string
  regionLabel: string
  /** Yerba si salió bien, ceibo si no: cancelar también puede fallar. */
  variant?: 'success' | 'error'
}

const FLAGS = ['guardado', 'error']

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

  useEffect(() => {
    // La marca sale de la URL apenas se muestra el aviso: si se queda, un F5 —o compartir el
    // enlace— vuelve a anunciar «guardado» sin que nadie haya guardado nada.
    const url = new URL(window.location.href)
    if (!FLAGS.some((flag) => url.searchParams.has(flag))) return
    for (const flag of FLAGS) url.searchParams.delete(flag)
    window.history.replaceState(null, '', `${url.pathname}${url.search}`)
  }, [])

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
