'use client'

import {
  DestructiveConfirmDialog,
  type DestructiveConfirmTexts,
} from '@/components/ui/destructive-confirm-dialog'
import { useBlock, type BlockFailure } from '@/hooks/use-block'

export type BlockDialogTexts = DestructiveConfirmTexts & {
  failures: Record<BlockFailure, string>
  /** Por clave de `moderation.errors`. */
  errors: Record<string, string>
}

type Props = {
  publicId: string
  /** El perfil, que al volver ya es el perfil bloqueado. */
  profilePath: string
  open: boolean
  onOpenChange: (open: boolean) => void
  texts: BlockDialogTexts
}

// Bloquear se deshace, pero los avales que borra no vuelven (FR-016): por eso confirma en un
// `Dialog`. Al salir bien, el perfil vuelve como perfil bloqueado, con su aviso.
export function BlockDialog({ publicId, profilePath, open, onOpenChange, texts }: Props) {
  const flow = useBlock({ publicId, returnPath: profilePath })

  async function confirm(close: () => void): Promise<string | null> {
    const outcome = await flow.block()
    if (outcome === null) return null
    if (outcome.kind === 'ok') {
      close()
      flow.land(outcome.notice)
      return null
    }
    if (outcome.kind === 'refused') return texts.errors[outcome.key] ?? texts.failures.no_response
    return texts.failures[outcome.kind]
  }

  return (
    <DestructiveConfirmDialog
      texts={texts}
      onConfirm={confirm}
      open={open}
      onOpenChange={onOpenChange}
    />
  )
}
