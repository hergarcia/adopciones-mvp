'use client'

import { useProfileDraft } from '@/hooks/use-profile-draft'
import { LazyProfileLeavingDialog } from './lazy-leaving-dialog'
import { ProfileForm, type ProfileFormProps } from './profile-form'
import type { ProfileLeavingProps } from './profile-form-types'

type Props = Omit<ProfileFormProps, 'draft' | 'Leaving'> & {
  /** La cuenta dueña del borrador de este navegador. */
  draftOwner: string
}

// En el alta el borrador guarda todo menos la foto, así que el aviso casi nunca hace falta: el
// guardia baja después de abrir (historia #326).
function DraftLeaving(props: ProfileLeavingProps) {
  return <LazyProfileLeavingDialog when={props.loss !== 'nothing'} props={props} />
}

export function CreateProfileForm({ draftOwner, ...props }: Props) {
  const draft = useProfileDraft(props.initial, draftOwner)
  return <ProfileForm {...props} draft={draft} Leaving={DraftLeaving} />
}
