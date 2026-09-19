'use client'

import { useState, useTransition } from 'react'
import { deleteAccount } from '@/actions/profile'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

export type DeleteTexts = {
  trigger: string
  title: string
  body: string
  confirm: string
  cancel: string
  failed: string
  close: string
}

// Confirmación irreversible, que es para lo que docs/10 reserva el Dialog. Se controla con `open`
// porque la acción tiene que terminar antes de cerrar: cerrar al tocar dejaría a la persona sin
// saber si se borró.
export function DeleteAccountDialog({ texts }: { texts: DeleteTexts }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function confirm() {
    setError(null)
    startTransition(async () => {
      const result = await deleteAccount()
      // Si sale bien la acción redirige, así que llegar acá es que no se borró nada.
      if (!result.ok) setError(texts.failed)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={texts.title}
      closeLabel={texts.close}
      trigger={
        <Button variant="ghost" className="text-accent">
          {texts.trigger}
        </Button>
      }
    >
      <p className="text-base text-ink">{texts.body}</p>
      {error ? <p className="mt-3 text-base text-accent">{error}</p> : null}
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
