'use client'

import { useState } from 'react'
import { markInProcessFromOffer } from '@/actions/application-responses'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'

type Props = {
  id: string
  /** Ya traducidos. `errors` por clave de `pets.status.errors`. */
  texts: { body: string; action: string; errors: Record<string, string> }
}

const FAILED = 'pets.status.errors.failed'

// La oferta que sigue a aceptar (FR-017): una nota sobre piedra con «Marcar en proceso» en
// `secondary`, porque la tirita de la pantalla ya es «Abrir WhatsApp». No se marca sola: sin tocarla,
// el animal sigue disponible. Al salir bien, la nota dice cómo quedó, con el verbo del botón.
export function InProcessOffer({ id, texts }: Props) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  async function mark() {
    setBusy(true)
    setFailure(null)
    const result = await markInProcessFromOffer(id).catch(() => null)
    setBusy(false)
    if (result?.ok) {
      setDone(result.data.notice)
      return
    }
    const key = result?.error ?? FAILED
    setFailure(texts.errors[key] ?? texts.errors[FAILED] ?? null)
  }

  return (
    <div className="flex flex-col items-start gap-3 bg-surface p-4">
      {done === null ? (
        <>
          <p className="text-sm text-ink">{texts.body}</p>
          <Button variant="secondary" loading={busy} onClick={() => void mark()}>
            {texts.action}
          </Button>
          {failure === null ? null : <ErrorText announce>{failure}</ErrorText>}
        </>
      ) : (
        <output className="text-sm font-medium text-ink">{done}</output>
      )}
    </div>
  )
}
