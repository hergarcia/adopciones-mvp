'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'

type Props = {
  label: string
  variant: 'secondary' | 'ghost'
  /** El id del texto que aclara qué pasa al tocarlo. */
  describedBy?: string
  className?: string
}

// El botón de un `<form action>` del servidor: el formulario funciona sin JavaScript, y esta hoja
// solo agrega el estado ocupado, que no deja un segundo toque.
export function FormSubmit({ label, variant, describedBy, className }: Props) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      variant={variant}
      loading={pending}
      aria-describedby={describedBy}
      className={className}
    >
      {label}
    </Button>
  )
}
