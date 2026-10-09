'use client'

import { useRouter } from 'next/navigation'
import { withdrawApplication } from '@/actions/applications'
import {
  DestructiveConfirmDialog,
  type DestructiveConfirmTexts,
} from '@/components/ui/destructive-confirm-dialog'

export type WithdrawApplicationTexts = DestructiveConfirmTexts & {
  /** Por clave de `applications.withdraw.errors`. */
  errors: Record<string, string>
}

type Props = {
  id: string
  texts: WithdrawApplicationTexts
  /** Adónde va al retirar; sin destino, la misma pantalla vuelve a decidir (el límite, FR-051). */
  doneHref: string | null
}

const FAILED = 'applications.withdraw.errors.failed'

// Retirar no se deshace (FR-052). Si ya estaba retirada o se cerró mientras tanto, lo dice dentro
// del diálogo y la pantalla de atrás se refresca con el estado real.
export function WithdrawApplicationDialog({ id, texts, doneHref }: Props) {
  const router = useRouter()

  async function withdraw(): Promise<string | null> {
    const result = await withdrawApplication(id).catch(() => null)
    if (result?.ok) {
      if (doneHref === null) router.refresh()
      else router.push(doneHref)
      return null
    }
    const key = result?.error ?? FAILED
    if (key !== FAILED) router.refresh()
    return texts.errors[key] ?? texts.errors[FAILED] ?? null
  }

  return <DestructiveConfirmDialog texts={texts} onConfirm={withdraw} triggerVariant="ghost" />
}
