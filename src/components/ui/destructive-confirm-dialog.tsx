'use client'

import { useState, useTransition } from 'react'
import { Button } from './button'
import { Dialog } from './dialog'
import { ErrorText } from './error-text'

export type DestructiveConfirmTexts = {
  trigger: string
  title: string
  body: string
  confirm: string
  cancel: string
  close: string
}

type Props = {
  /** Todo ya traducido. */
  texts: DestructiveConfirmTexts
  /**
   * Hace lo irreversible. Devuelve el error ya traducido, o `null` si salió bien o ya navegó.
   * `close` es para cuando no hay nada que confirmar y la pantalla tiene que mostrar el estado real.
   */
  onConfirm: (close: () => void) => Promise<string | null>
}

// La confirmación de algo que no se deshace (docs/10 §Componentes, `Dialog`). Controlado con `open`
// y sin cerrarse mientras la acción corre: cerrar al tocar dejaría a la persona sin saber si pasó.
export function DestructiveConfirmDialog({ texts, onConfirm }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function confirm() {
    setError(null)
    startTransition(async () => {
      setError(await onConfirm(() => setOpen(false)))
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (pending ? undefined : setOpen(next))}
      title={texts.title}
      closeLabel={texts.close}
      trigger={<Button variant="ghost-danger">{texts.trigger}</Button>}
    >
      <p className="text-base text-ink">{texts.body}</p>
      {error ? (
        <div className="mt-3 w-full">
          <ErrorText announce>{error}</ErrorText>
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="danger" onClick={confirm} loading={pending}>
          {texts.confirm}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
          {texts.cancel}
        </Button>
      </div>
    </Dialog>
  )
}
