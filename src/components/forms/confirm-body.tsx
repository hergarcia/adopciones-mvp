import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'

type Props = {
  /** Ya traducidos. */
  body: string
  confirm: string
  cancel: string
  /** Lo que no llegó, adentro: reintentar es tocar el mismo botón. */
  failure: string | null
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}

// El cuerpo de una confirmación que se queda abierta mientras corre: qué va a pasar, el error
// adentro, confirmar en `secondary` y cancelar en `ghost`. Lo comparten el `Dialog` de lo
// irreversible y la `Sheet` de lo que se deshace.
export function ConfirmBody({ body, confirm, cancel, failure, busy, onConfirm, onCancel }: Props) {
  return (
    <>
      <p className="text-base text-ink">{body}</p>
      {failure === null ? null : (
        <div className="mt-3 w-full">
          <ErrorText announce>{failure}</ErrorText>
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button variant="secondary" loading={busy} onClick={onConfirm}>
          {confirm}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={onCancel}>
          {cancel}
        </Button>
      </div>
    </>
  )
}
