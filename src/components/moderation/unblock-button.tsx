'use client'

import { useState } from 'react'
import { useAnnounce } from '@/components/forms/announce-notices'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { useBlock, type BlockFailure } from '@/hooks/use-block'

export type UnblockTexts = {
  label: string
  failures: Record<BlockFailure, string>
  /** Para una lista: «Desbloqueaste a Ana» y «Ya estaba desbloqueada», que anuncia la lista. */
  done?: { unblocked: string; already: string }
}

type Props = {
  publicId: string
  /** La pantalla que se vuelve a dibujar, con el aviso en la dirección. */
  returnPath: string
  /** En una lista, la fila sale y el aviso lo da la lista (`AnnounceNotices`). */
  inList?: boolean
  size?: 'sm' | 'md'
  texts: UnblockTexts
}

// Desbloquear no pide confirmación: se deshace bloqueando de nuevo, y nada se borra (FR-016). Quieto
// · haciendo · error, con el error debajo y reintentar en el mismo botón.
export function UnblockButton({ publicId, returnPath, inList = false, size, texts }: Props) {
  const flow = useBlock({ publicId, returnPath })
  const announce = useAnnounce()
  const [error, setError] = useState<string | null>(null)

  async function unblock() {
    setError(null)
    const outcome = await flow.unblock()
    if (outcome === null) return
    if (outcome.kind === 'ok') {
      if (inList && texts.done) {
        announce(outcome.notice === 'ya' ? texts.done.already : texts.done.unblocked)
      }
      flow.land(outcome.notice)
      return
    }
    setError(outcome.kind === 'refused' ? texts.failures.no_response : texts.failures[outcome.kind])
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="secondary" size={size} loading={flow.busy} onClick={() => void unblock()}>
        {texts.label}
      </Button>
      {error === null ? null : <ErrorText announce>{error}</ErrorText>}
    </div>
  )
}
