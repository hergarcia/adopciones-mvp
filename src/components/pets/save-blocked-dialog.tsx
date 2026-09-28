'use client'

import { ChoiceDialog } from '@/components/forms/choice-dialog'

type Props = {
  open: boolean
  /** Ya traducidos, del caso: la sesión vencida o el nivel 1 perdido. */
  texts: { title: string; body: string; action: string; stay: string; close: string }
  onAction: () => void
  onStay: () => void
}

// Sin reintento en el lugar: hay que entrar o verificar (FR-022, FR-023). El aviso mismo dice qué se
// conserva y qué se pierde al irse, así que elegir irse no abre un segundo aviso. Quedarse deja todo
// en pantalla, para resolverlo en otra pestaña y volver a tocar la tirita.
export function SaveBlockedDialog({ open, texts, onAction, onStay }: Props) {
  return (
    <ChoiceDialog
      open={open}
      title={texts.title}
      closeLabel={texts.close}
      onDismiss={onStay}
      primary={{ label: texts.action, onClick: onAction }}
      secondary={{ label: texts.stay, onClick: onStay }}
    >
      <p>{texts.body}</p>
    </ChoiceDialog>
  )
}
