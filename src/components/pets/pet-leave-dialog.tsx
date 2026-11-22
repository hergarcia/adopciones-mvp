'use client'

import { LeaveFormDialog } from '@/components/forms/leave-form-dialog'
import type { useLeaveForm } from '@/hooks/use-leave-form'
import type { PetDialogTexts } from './pet-form-types'

type Props = {
  texts: PetDialogTexts
  dirty: boolean
  leaving: ReturnType<typeof useLeaveForm>
}

// Al lado del guardia, en lo que sale al abrir: en el cuerpo, que baja después, un toque al menú
// antes de que llegara no abría nada (historia #338). Lo comparten un animal y una camada.
export function PetLeaveDialog({ texts, dirty, leaving }: Props) {
  return (
    <LeaveFormDialog
      dirty={dirty}
      asked={leaving.asked}
      texts={{
        title: texts.leavingTitle,
        body: texts.leavingBody,
        stay: texts.leavingStay,
        leave: texts.leavingLeave,
        close: texts.close,
      }}
      onStay={leaving.stay}
      onLeave={leaving.leave}
    />
  )
}
