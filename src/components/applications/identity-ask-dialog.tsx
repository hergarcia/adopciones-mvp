'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { askIdentity } from '@/actions/application-responses'
import { ConfirmBody } from '@/components/forms/confirm-body'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { identityAskedPath } from '@/lib/applications/paths'

export type IdentityAskTexts = {
  trigger: string
  title: string
  body: string
  confirm: string
  retry: string
  cancel: string
  close: string
  /** Lo que no llegó, adentro del `Dialog`. */
  failed: string
}

type Props = { id: string; texts: IdentityAskTexts }

// Dialog y no Sheet: el pedido manda un correo y no se deshace; el reintento es la misma llamada y
// la base contesta `already` si el primero llegó.
export function IdentityAskDialog({ id, texts }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function ask() {
    setBusy(true)
    setFailed(false)
    const result = await askIdentity(id).catch(() => null)
    setBusy(false)
    const outcome = result === null ? undefined : result.ok ? 'asked' : result.detail?.outcome
    if (outcome === undefined) {
      setFailed(true)
      return
    }
    setOpen(false)
    router.push(identityAskedPath(id, outcome))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return
        setOpen(next)
        if (next) setFailed(false)
      }}
      title={texts.title}
      closeLabel={texts.close}
      trigger={
        <Button variant="secondary" className="w-full md:w-auto">
          {texts.trigger}
        </Button>
      }
    >
      <ConfirmBody
        body={texts.body}
        confirm={failed ? texts.retry : texts.confirm}
        cancel={texts.cancel}
        failure={failed ? texts.failed : null}
        busy={busy}
        onConfirm={() => void ask()}
        onCancel={() => setOpen(false)}
      />
    </Dialog>
  )
}
