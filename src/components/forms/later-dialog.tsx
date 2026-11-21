'use client'

import { useState, type ComponentType } from 'react'
import { Button } from '@/components/ui/button'
import { deferredPart, type LaterPart } from '@/components/ui/deferred-part'
import { Dialog } from '@/components/ui/dialog'

/** Lo que el diálogo le da a lo de adentro, que llega después de abrir. */
export type LaterDialogControl = {
  close: () => void
  /** Mientras la acción corre, el diálogo no se cierra: cerrar dejaría sin saber si pasó. */
  onPending: (pending: boolean) => void
}

/** Ya traducidos. `body`, lo que va a pasar, debajo del título; `part`, la espera y el aviso. */
type LaterTexts = { title: string; close: string; body?: string; part: LaterPart }

/**
 * Un `Dialog` cuyo botón, título y texto salen con la pantalla y contestan desde el primer toque,
 * mientras lo de adentro —lo que se elige, los botones y lo que hace— llega después (historia #316):
 * borrar, quitar una cría, volver a publicar una camada o terminar una adopción. Cerrarlo olvida lo
 * elegido: lo de adentro se desmonta.
 */
export function laterDialog<P extends { texts: LaterTexts }>(
  load: () => Promise<ComponentType<P & LaterDialogControl>>,
) {
  const Body = deferredPart(load, true)
  return function LaterDialog({
    trigger: { label, ...button },
    props,
  }: {
    /** El botón que lo abre, con el aspecto que le toca donde está. */
    trigger: React.ComponentProps<typeof Button> & { label: string }
    props: P
  }) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const { texts } = props
    return (
      <Dialog
        open={open}
        onOpenChange={(next) => (isPending ? undefined : setOpen(next))}
        title={texts.title}
        closeLabel={texts.close}
        trigger={<Button {...button}>{label}</Button>}
      >
        {texts.body === undefined ? null : <p className="text-base text-ink">{texts.body}</p>}
        <Body
          part={texts.part}
          props={{ ...props, close: () => setOpen(false), onPending: setIsPending }}
        />
      </Dialog>
    )
  }
}
