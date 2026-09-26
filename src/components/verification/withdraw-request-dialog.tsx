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
  hrefs: {
    /** Al retirar: la vista de pedir con el aviso. */
    withdrawn: string
    /** Si ya se había resuelto o vencido: el estado real, con el aviso de que no se retiró. */
    notWithdrawn: string
  }
}

// Retirar es irreversible —las imágenes se borran en ese momento— (FR-012).
export function WithdrawRequestDialog({ texts, hrefs }: Props) {
  const router = useRouter()

  async function withdraw(close: () => void): Promise<string | null> {
    const result = await withdrawIdentityRequest().catch(() => null)
    if (result?.ok) {
      router.push(hrefs.withdrawn)
      return null
    }
    // Ya se había resuelto o vencido: se ve el estado real y se dice que no se retiró (FR-012b).
    if (result?.error === 'identity.errors.not_open') {
      close()
      router.replace(hrefs.notWithdrawn)
      return null
    }
    const key = result?.error ?? 'identity.errors.withdraw_failed'
    return texts.errors[key] ?? texts.errors['identity.errors.withdraw_failed'] ?? null
  }

  return <DestructiveConfirmDialog texts={texts} onConfirm={withdraw} />
}
