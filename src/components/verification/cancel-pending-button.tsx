'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { cancelPendingPhone } from '@/actions/phone'

type Props = {
  /** La pantalla desde la que se cancela, con su consulta: se vuelve ahí (FR-015a). */
  from: string
  label: string
}

// Un formulario de verdad, así cancelar funciona sin JavaScript; lo que agrega el cliente es el
// estado ocupado, que no deja un segundo toque.
export function CancelPendingButton({ from, label }: Props) {
  return (
    <form action={cancelPendingPhone}>
      <input type="hidden" name="from" value={from} />
      <Submit label={label} />
    </form>
  )
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="ghost" loading={pending}>
      {label}
    </Button>
  )
}
