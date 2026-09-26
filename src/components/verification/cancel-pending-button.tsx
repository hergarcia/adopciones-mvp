import { cancelPendingPhone } from '@/actions/phone'
import { FormSubmit } from './form-submit'

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
      <FormSubmit label={label} variant="ghost" />
    </form>
  )
}
