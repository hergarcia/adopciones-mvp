'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { acceptApplication } from '@/actions/application-responses'
import { ConfirmBody } from '@/components/forms/confirm-body'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

export type AcceptTexts = {
  trigger: string
  title: string
  body: string
  confirm: string
  cancel: string
  close: string
  /** Por clave de `inbox.errors`. */
  errors: Record<string, string>
}

type Props = {
  id: string
  /** Adónde va al aceptar: la misma solicitud con la oferta de «En proceso». */
  doneHref: string
  texts: AcceptTexts
}

const FAILED = 'inbox.errors.failed'

// Aceptar da el teléfono de las dos y no se deshace en el sentido de lo ya visto, así que es un
// `Dialog` (FR-010). Quieto · haciendo · error, adentro y sin cerrarse mientras corre. Sin el
// teléfono propio va al aviso de verificación con la vuelta; si la solicitud cambió mientras tanto,
// lo dice y la pantalla de atrás se refresca con el estado real (FR-044).
export function AcceptDialog({ id, doneHref, texts }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  async function accept() {
    setBusy(true)
    setFailure(null)
    const result = await acceptApplication(id).catch(() => null)
    setBusy(false)
    if (result?.ok) {
      setOpen(false)
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return
        setOpen(next)
        if (next) setFailure(null)
      }}
      title={texts.title}
      closeLabel={texts.close}
      trigger={
        <Button variant="tirita" size="lg" className="w-full md:w-auto">
          {texts.trigger}
        </Button>
      }
    >
      <ConfirmBody
        body={texts.body}
        confirm={texts.confirm}
        cancel={texts.cancel}
        failure={failure}
        busy={busy}
        onConfirm={() => void accept()}
        onCancel={() => setOpen(false)}
      />
    </Dialog>
  )
}
