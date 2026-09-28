import { LeavingDialog } from '@/components/forms/leaving-dialog'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import type { LeavingLoss } from '@/lib/profile/leaving-loss'
import type { ProfileLeavingTexts } from './profile-form-types'

type Props = {
  /** Lo que se pierde al salir: sin nada que perder no frena nada, y el texto dice solo eso. */
  loss: LeavingLoss
  /** Con un guardado en curso, salir es lo que se espera que pase. */
  saving: boolean
  texts: ProfileLeavingTexts
}

export function ProfileLeavingDialog({ loss, saving, texts }: Props) {
  const { leavingTo, leave, stay } = useUnsavedChanges(loss !== 'nothing' && !saving)

  return (
    <LeavingDialog
      open={leavingTo !== null}
      texts={{ ...texts, body: loss === 'photo' ? texts.bodyPhoto : texts.body }}
      onStay={stay}
      onLeave={leave}
    />
  )
}
