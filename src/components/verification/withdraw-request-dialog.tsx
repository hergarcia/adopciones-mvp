'use client'

import { useRouter } from 'next/navigation'
import { withdrawIdentityRequest } from '@/actions/identity'
import {
  DestructiveConfirmDialog,
  type DestructiveConfirmTexts,
} from '@/components/ui/destructive-confirm-dialog'

export type WithdrawTexts = DestructiveConfirmTexts & {
  /** Por clave de `identity.errors`. */
  errors: Record<string, string>
}

type Props = {
  texts: WithdrawTexts
  /** A dónde va al retirar: la vista de pedir con el aviso. */
  doneHref: string
}

// Retirar es irreversible —las imágenes se borran en ese momento— (FR-012).
export function WithdrawRequestDialog({ texts, doneHref }: Props) {
  const router = useRouter()

  async function withdraw(close: () => void): Promise<string | null> {
    const result = await withdrawIdentityRequest().catch(() => null)
    if (result?.ok) {
      router.push(doneHref)
      return null
    }
    // Ya se había resuelto o vencido: se ve el estado real (FR-012b).
    if (result?.error === 'identity.errors.not_open') {
      close()
      router.refresh()
      return null
    }
    const key = result?.error ?? 'identity.errors.withdraw_failed'
    return texts.errors[key] ?? texts.errors['identity.errors.withdraw_failed'] ?? null
  }

  return <DestructiveConfirmDialog texts={texts} onConfirm={withdraw} />
}
