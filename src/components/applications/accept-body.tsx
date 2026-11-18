'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { acceptApplication } from '@/actions/application-responses'
import { ConfirmBody } from '@/components/forms/confirm-body'
import type { LaterDialogControl } from '@/components/forms/later-dialog'
import type { AcceptTarget } from './accept-dialog'

const FAILED = 'inbox.errors.failed'

// Lo de adentro de la pregunta de aceptar, que llega después de abrir. Haciendo · error, adentro y
// sin cerrarse mientras corre. Sin el teléfono propio va al aviso de verificación con la vuelta; si
// la solicitud cambió mientras tanto, lo dice y la pantalla de atrás se refresca con el estado real
// (FR-044).
export function AcceptBody({
  id,
  doneHref,
  texts,
  close,
  onPending,
}: AcceptTarget & LaterDialogControl) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  async function accept() {
    setBusy(true)
    onPending(true)
    setFailure(null)
    const result = await acceptApplication(id).catch(() => null)
    setBusy(false)
    onPending(false)
    if (result?.ok) {
      close()
      router.push(doneHref)
      return
    }
    const redirect = result?.detail?.redirect
    if (redirect !== undefined) {
      router.push(redirect)
      return
    }
    const key = result?.error ?? FAILED
    if (key !== FAILED) router.refresh()
    setFailure(texts.errors[key] ?? texts.errors[FAILED] ?? null)
  }

  return (
    <ConfirmBody
      confirm={texts.confirm}
      cancel={texts.cancel}
      failure={failure}
      busy={busy}
      onConfirm={() => void accept()}
      onCancel={close}
    />
  )
}
