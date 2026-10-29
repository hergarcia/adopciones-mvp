'use client'

import { useState } from 'react'
import { deletePetAlert } from '@/actions/pet-alerts'
import { useAnnounce } from '@/components/forms/announce-notices'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'

export type DeleteAlertTexts = {
  label: string
  /** «Borraste el aviso.», que anuncia la lista: la fila sale. */
  done: string
  failed: string
  session: string
}

type Props = { alertId: string; texts: DeleteAlertTexts }

// Sin confirmación: se vuelve a crear desde el listado con un toque.
export function DeleteAlertButton({ alertId, texts }: Props) {
  const announce = useAnnounce()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove() {
    setBusy(true)
    setError(null)
    const result = await deletePetAlert(alertId).catch(() => null)
    setBusy(false)
    if (result?.ok) return announce(texts.done)
    setError(result?.error === 'alerts.errors.session' ? texts.session : texts.failed)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button variant="ghost" size="sm" loading={busy} onClick={() => void remove()}>
        {texts.label}
      </Button>
      {error === null ? null : <ErrorText announce>{error}</ErrorText>}
    </div>
  )
}
