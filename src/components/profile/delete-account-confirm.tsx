'use client'

import { deleteAccount } from '@/actions/profile'
import { clearAccountDrafts } from '@/lib/drafts/account-drafts'
import { DestructiveConfirmDialog } from '@/components/ui/destructive-confirm-dialog'
import type { DeleteTexts } from './delete-account-dialog'

type Props = { texts: DeleteTexts; open: boolean; onOpenChange: (open: boolean) => void }

export function DeleteAccountConfirm({ texts, open, onOpenChange }: Props) {
  async function remove(): Promise<string | null> {
    // Antes y no después: si sale bien, la acción redirige y acá no se vuelve.
    clearAccountDrafts()
    const result = await deleteAccount()
    // Si sale bien la acción redirige, así que llegar acá es que no se borró nada.
    return result.ok ? null : texts.failed
  }

  return (
    <DestructiveConfirmDialog
      texts={texts}
      onConfirm={remove}
      open={open}
      onOpenChange={onOpenChange}
    />
  )
}
