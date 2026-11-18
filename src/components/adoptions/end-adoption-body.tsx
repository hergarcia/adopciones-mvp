'use client'

import { ConfirmBody } from '@/components/forms/confirm-body'
import type { EndAdoptionTexts } from './end-adoption-dialog'

type Props = { texts: EndAdoptionTexts; onConfirm: () => void; close: () => void }

export function EndAdoptionBody({ texts, onConfirm, close }: Props) {
  return (
    <ConfirmBody
      confirm={texts.confirm}
      cancel={texts.cancel}
      failure={null}
      busy={false}
      onConfirm={() => {
        close()
        onConfirm()
      }}
      onCancel={close}
    />
  )
}
