'use client'

import { useEffect, useId, useState } from 'react'
import { trackProfileMoment } from '@/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCanShare } from '@/hooks/use-can-share'

export type CopyProfileLinkTexts = {
  copy: string
  /** El mismo botón en un teléfono, donde abre la hoja de compartir del sistema. */
  share: string
  copied: string
  /** Lo que se dice cuando el navegador no deja copiar y el enlace queda a la vista. */
  manual: string
}

type Props = { url: string; texts: CopyProfileLinkTexts }

// Cuánto se queda «Enlace copiado», lo mismo que un `Toast` (docs/10).
const COPIED_MS = 4000

// Mandar el enlace al perfil público con un toque (FR-022). En un teléfono abre la hoja de compartir
// del sistema, que pone WhatsApp a un toque y también ofrece copiar: copiar, cambiar de app y pegar
// era más largo que preguntar en el grupo. En otro lado, o si la hoja falla, lo copia; y si el
// navegador tampoco deja copiar —sin permiso, o una página que no es segura—, el enlace aparece
// seleccionado para copiarlo a mano (research R13).
export function CopyProfileLink({ url, texts }: Props) {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const inputId = useId()
  const canShare = useCanShare()

  useEffect(() => {
    if (state === 'manual') {
      const input = document.getElementById(inputId)
      if (input instanceof HTMLInputElement) {
        input.focus()
        input.select()
      }
    }
    if (state !== 'copied') return undefined
    const timer = setTimeout(() => setState('idle'), COPIED_MS)
    return () => clearTimeout(timer)
  }, [state, inputId])

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setState('copied')
    } catch {
      setState('manual')
    }
    void trackProfileMoment('profile_link_copied')
  }

  async function send() {
    if (!canShare) return copy()
    try {
      await navigator.share({ url })
      void trackProfileMoment('profile_link_copied')
    } catch (error) {
      // Cerrar la hoja sin elegir nada es cambiar de idea, no un fallo.
      if (error instanceof DOMException && error.name === 'AbortError') return
      await copy()
    }
  }

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <Button variant="secondary" onClick={() => void send()}>
        {canShare ? texts.share : texts.copy}
      </Button>
      <output className="text-sm text-primary">{state === 'copied' ? texts.copied : null}</output>
      {state === 'manual' ? (
        <div className="flex w-full flex-col gap-1">
          <label htmlFor={inputId} className="text-sm text-ink-muted">
            {texts.manual}
          </label>
          <Input id={inputId} readOnly value={url} onFocus={(event) => event.target.select()} />
        </div>
      ) : null}
    </div>
  )
}
