'use client'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

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
    <Dialog open={open} onOpenChange={onStay} title={texts.title} closeLabel={texts.close}>
      <p className="text-base text-ink">{texts.body}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="primary" onClick={onStay}>
          {texts.stay}
        </Button>
        <Button variant="secondary" onClick={onLeave}>
          {texts.leave}
        </Button>
      </div>
    </Dialog>
  )
}
