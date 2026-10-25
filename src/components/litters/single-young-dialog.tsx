'use client'

import { ChoiceDialog } from '@/components/forms/choice-dialog'

type Props = {
  open: boolean
  /** Ya traducidos. */
  texts: { title: string; body: string; publishAsPet: string; addYoung: string; close: string }
  onPublishAsPet: () => void
  onAddYoung: () => void
  onClose: () => void
}

export function SingleYoungDialog({ open, texts, onPublishAsPet, onAddYoung, onClose }: Props) {
  return (
    <ChoiceDialog
      open={open}
      title={texts.title}
      closeLabel={texts.close}
      onDismiss={onClose}
      primary={{ label: texts.publishAsPet, onClick: onPublishAsPet }}
      secondary={{ label: texts.addYoung, onClick: onAddYoung }}
    >
      <p>{texts.body}</p>
    </ChoiceDialog>
  )
}
