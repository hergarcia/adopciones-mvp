'use client'

import { useState } from 'react'
import { ProfileForm, type ProfileFormProps } from './profile-form'
import { ProfileLeavingDialog } from './leaving-dialog'
import type { ProfileLeavingProps } from './profile-form-types'

type Props = Omit<ProfileFormProps, 'draft' | 'Leaving'>

// Editando, lo que vale es lo guardado y no hay borrador (FR-018). El guardia sale al abrir: en lo
// que bajaba después, un toque al menú que llegaba antes se iba sin preguntar (historia #340). El
// aviso baja apenas abre, así aparece aunque la señal se corte con la pantalla abierta.
function EditLeaving(props: ProfileLeavingProps) {
  return <ProfileLeavingDialog {...props} preload />
}

const keepNothing = () => {}

export function EditProfileForm(props: Props) {
  const [values, setValues] = useState(props.initial)
  return (
    <ProfileForm
      {...props}
      draft={{ values, setValues, clearDraft: keepNothing, canKeepDraft: false }}
      Leaving={EditLeaving}
    />
  )
}
