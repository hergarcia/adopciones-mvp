import { cn } from '@/lib/cn'
import { DeleteAccountDialog, type DeleteTexts } from './delete-account-dialog'
import { SignOutForm } from './sign-out-form'

type Props = {
  signOutLabel: string
  deleteTexts: DeleteTexts
  className?: string
}

// Las dos salidas de una cuenta, juntas y en el mismo orden en las dos pantallas donde aparecen
// (docs/08 §Regla de dos). Van al pie y en `ghost`: son salidas, no el próximo paso.
export function AccountActions({ signOutLabel, deleteTexts, className }: Props) {
  return (
    <div className={cn('mt-8 flex flex-col items-start gap-2', className)}>
      <SignOutForm label={signOutLabel} />
      <DeleteAccountDialog texts={deleteTexts} />
    </div>
  )
}
