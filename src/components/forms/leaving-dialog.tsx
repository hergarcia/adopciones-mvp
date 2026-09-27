'use client'

import { ChoiceDialog } from './choice-dialog'

export type LeavingTexts = {
  title: string
  body: string
  stay: string
  leave: string
  close: string
}

type Props = {
  open: boolean
  texts: LeavingTexts
  onStay: () => void
  onLeave: () => void
}

// El aviso antes de perder lo cargado: no se deshace, que es para lo que docs/10 reserva el
// `Dialog`. «Seguir editando» primero, porque es lo que quiere quien llegó ahí sin querer.
export function LeavingDialog({ open, texts, onStay, onLeave }: Props) {
  return (
    <ChoiceDialog
      open={open}
      title={texts.title}
      closeLabel={texts.close}
      onDismiss={onStay}
      primary={{ label: texts.stay, onClick: onStay }}
      secondary={{ label: texts.leave, onClick: onLeave }}
    >
      <p>{texts.body}</p>
    </ChoiceDialog>
  )
}
