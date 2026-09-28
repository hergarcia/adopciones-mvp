'use client'

import { deleteAccount } from '@/actions/profile'
import { clearProfileDraft } from '@/hooks/use-profile-draft'
import {
  DestructiveConfirmDialog,
  type DestructiveConfirmTexts,
} from '@/components/ui/destructive-confirm-dialog'

export type DeleteTexts = DestructiveConfirmTexts & { failed: string }

export function DeleteAccountDialog({ texts }: { texts: DeleteTexts }) {
  async function remove(): Promise<string | null> {
    // Antes y no después: si sale bien, la acción redirige y acá no se vuelve.
    clearProfileDraft()
    const result = await deleteAccount()
    // Si sale bien la acción redirige, así que llegar acá es que no se borró nada.
    return result.ok ? null : texts.failed
  }

  return <DestructiveConfirmDialog texts={texts} onConfirm={remove} />
}
