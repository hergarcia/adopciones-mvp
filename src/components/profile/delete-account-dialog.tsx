'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { DestructiveConfirmTexts } from '@/components/ui/destructive-confirm-dialog'
import { RetryNotice } from '@/components/ui/retry-notice'
import { tapFailedTexts, useAfterOpenOrTap } from '@/hooks/use-after-open-or-tap'

export type DeleteTexts = DestructiveConfirmTexts & { failed: string }

// La confirmación y lo que borra bajan recién al tocar: se tocan poco y pesaban al abrir «Contá quién
// sos» (historia #326). El botón sale con la pantalla y contesta desde el primer toque: trabaja
// mientras la confirmación baja y la abre apenas está, o avisa debajo si no llega.
const loadConfirm = () =>
  import('./delete-account-confirm').then((module) => module.DeleteAccountConfirm)

export function DeleteAccountDialog({ texts }: { texts: DeleteTexts }) {
  const confirm = useAfterOpenOrTap(loadConfirm, false, false)
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const press = () => (confirm.value === null ? confirm.wait(() => setOpen(true)) : setOpen(true))
  const Confirm = confirm.value

  return (
    <>
      <Button
        ref={trigger}
        variant="ghost-danger"
        aria-haspopup="dialog"
        aria-expanded={open}
        loading={confirm.isWaiting}
        onClick={press}
      >
        {texts.trigger}
      </Button>
      {confirm.hasFailed ? <RetryNotice texts={tapFailedTexts()} onRetry={press} /> : null}
      {Confirm === null ? null : (
        <Confirm
          texts={texts}
          open={open}
          onOpenChange={(next) => {
            setOpen(next)
            // Abierto desde afuera, el diálogo no sabe a quién devolverle el foco: vuelve al botón
            // apenas deja de retenerlo, como hacía con su disparador propio.
            if (!next) requestAnimationFrame(() => trigger.current?.focus())
          }}
        />
      )}
    </>
  )
}
