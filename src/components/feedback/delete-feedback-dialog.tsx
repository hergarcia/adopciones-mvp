'use client'

import type { ActionResult } from '@/actions/result'
import { useAnnounce } from '@/components/forms/announce-notices'
import {
  DestructiveConfirmDialog,
  type DestructiveConfirmTexts,
} from '@/components/ui/destructive-confirm-dialog'

export type DeleteFeedbackTexts = DestructiveConfirmTexts & {
  deleted: string
  /** Ya la había borrado otra pestaña u otra persona que administra. */
  gone: string
  /** Por clave de `feedback.errors`. */
  errors: Record<string, string>
}

type Props = {
  id: string
  texts: DeleteFeedbackTexts
  remove: (input: { id: string }) => Promise<ActionResult<null>>
}

const NOT_FOUND = 'feedback.errors.not_found'
const FAILED = 'feedback.errors.delete_failed'

// «Borrar» una opinión no se deshace (FR-041): se confirma en un `Dialog`. El disparador va en `ghost`
// porque se repite en cada opinión y el ceibo va una vez por pantalla, adentro del diálogo. Borrada,
// sale de la lista al recargarse y el aviso vive por encima de ella; la que ya no estaba, también.
export function DeleteFeedbackDialog({ id, texts, remove }: Props) {
  const announce = useAnnounce()

  async function confirm(close: () => void): Promise<string | null> {
    const result = await remove({ id }).catch(() => null)
    const failure = result === null ? FAILED : result.ok ? null : result.error
    if (failure === null || failure === NOT_FOUND) {
      close()
      announce(failure === null ? texts.deleted : texts.gone)
      return null
    }
    return texts.errors[failure] ?? texts.errors[FAILED] ?? ''
  }

  return <DestructiveConfirmDialog texts={texts} onConfirm={confirm} triggerVariant="ghost" />
}
