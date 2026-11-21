'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { askIdentity } from '@/actions/application-responses'
import { ConfirmBody } from '@/components/forms/confirm-body'
import type { LaterDialogControl } from '@/components/forms/later-dialog'
import { identityAskedPath } from '@/lib/applications/paths'
import type { IdentityAskTarget } from './identity-ask-dialog'

// Lo de adentro del pedido de identidad, que llega después de abrir. El reintento es la misma
// llamada y la base contesta `already` si el primero llegó.
export function IdentityAskBody({
  id,
  texts,
  close,
  onPending,
}: IdentityAskTarget & LaterDialogControl) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function ask() {
    setBusy(true)
    onPending(true)
    setFailed(false)
    const result = await askIdentity(id).catch(() => null)
    setBusy(false)
    onPending(false)
    const outcome = result === null ? undefined : result.ok ? 'asked' : result.detail?.outcome
    if (outcome === undefined) {
      setFailed(true)
      return
    }
    close()
    router.push(identityAskedPath(id, outcome))
  }

  return (
    <ConfirmBody
      confirm={failed ? texts.retry : texts.confirm}
      cancel={texts.cancel}
      failure={failed ? texts.failed : null}
      busy={busy}
      onConfirm={() => void ask()}
      onCancel={close}
    />
  )
}
