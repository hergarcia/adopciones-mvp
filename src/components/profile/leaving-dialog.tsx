'use client'

import { LeaveFormDialog } from '@/components/forms/leave-form-dialog'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import type { ProfileLeavingProps } from './profile-form-types'

type Props = ProfileLeavingProps & {
  /** El aviso baja después de abrir aunque no haya cambios (ver `LeaveFormDialog`). */
  preload?: boolean
}

export function ProfileLeavingDialog({ loss, saving, texts, preload = false }: Props) {
  const { asked, leave, stay } = useUnsavedChanges(loss !== 'nothing' && !saving)

  return (
    <LeaveFormDialog
      dirty={loss !== 'nothing'}
      asked={asked}
      texts={{ ...texts, body: loss === 'photo' ? texts.bodyPhoto : texts.body }}
      onStay={stay}
      onLeave={leave}
      preload={preload}
    />
  )
}
