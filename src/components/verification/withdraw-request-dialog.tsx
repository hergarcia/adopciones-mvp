'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { withdrawIdentityRequest } from '@/actions/identity'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { ErrorText } from '@/components/ui/error-text'

export type WithdrawTexts = {
  trigger: string
  title: string
  body: string
  confirm: string
  cancel: string
  close: string
  /** Por clave de `identity.errors`. */
  errors: Record<string, string>
}

type Props = {
  texts: WithdrawTexts
  /** A dónde va al retirar: la vista de pedir con el aviso. */
  doneHref: string
}

// Retirar es irreversible —las imágenes se borran en ese momento—, así que confirma en un `Dialog`
// (FR-012). Se controla con `open`, como borrar la cuenta: cerrar al tocar dejaría a la persona sin
// saber si se retiró.
export function WithdrawRequestDialog({ texts, doneHref }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function confirm() {
    setError(null)
    startTransition(async () => {
      const result = await withdrawIdentityRequest().catch(() => null)
      if (result?.ok) return router.push(doneHref)
      // Ya se había resuelto o vencido: se ve el estado real (FR-012b).
      if (result?.error === 'identity.errors.not_open') {
        setOpen(false)
        return router.refresh()
      }
      const key = result?.error ?? 'identity.errors.withdraw_failed'
      setError(texts.errors[key] ?? texts.errors['identity.errors.withdraw_failed'] ?? null)
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
