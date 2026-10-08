'use client'

import { useState } from 'react'
import { ConfirmBody } from '@/components/forms/confirm-body'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

export type EndAdoptionTexts = {
  /** «¿Volver a publicar a Tobi?». */
  title: string
  /** «La adopción con Ana termina: ninguna de las dos va a ver más el teléfono de la otra.». */
  body: string
  confirm: string
  cancel: string
  close: string
}

type Props = {
  /** El botón «Volver a publicar», con el aspecto que le toca en la card o en la pantalla. */
  trigger: React.ComponentProps<typeof Button> & { label: string }
  texts: EndAdoptionTexts
  /** Corre «Volver a publicar» con el flujo de siempre, que dice cómo terminó (#59). */
  onConfirm: () => void
}

// Volver a publicar un adoptado a una persona termina su adopción y el teléfono deja de verse para
// las dos (FR-031): se confirma antes; cancelar no cambia nada. Lo que no llegó lo dice el flujo de
// las acciones, como cualquier otro cambio de estado.
export function EndAdoptionDialog({ trigger: { label, ...button }, texts, onConfirm }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={texts.title}
      closeLabel={texts.close}
      trigger={<Button {...button}>{label}</Button>}
    >
      <ConfirmBody
        body={texts.body}
        confirm={texts.confirm}
        cancel={texts.cancel}
        failure={null}
        busy={false}
        onConfirm={() => {
          setOpen(false)
          onConfirm()
        }}
        onCancel={() => setOpen(false)}
      />
    </Dialog>
  )
}
