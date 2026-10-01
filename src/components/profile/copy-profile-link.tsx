'use client'

import { useEffect, useId, useState } from 'react'
import { trackProfileMoment } from '@/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCanShare } from '@/hooks/use-can-share'
import { readShareDevice } from '@/lib/share/device'
import { shareLink } from '@/lib/share/share-mode'

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
// era más largo que preguntar en el grupo. Cuándo se abre la hoja, cuándo se copia y cuándo el
// enlace queda a mano lo decide `lib/share/share-mode.ts`, lo mismo que para «Compartir» en la
// ficha; acá solo se dibuja cada salida (research R13).
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

  async function send() {
    const outcome = await shareLink({
      device: readShareDevice(),
      url,
      share: (data) => navigator.share(data),
      copy: (text) => navigator.clipboard.writeText(text),
    })
    if (outcome === 'cancelled') return
    if (outcome !== 'shared') setState(outcome)
    void trackProfileMoment('profile_link_copied')
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
