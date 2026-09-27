'use client'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

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
    <Dialog open={open} onOpenChange={onStay} title={texts.title} closeLabel={texts.close}>
      <p className="text-base text-ink">{texts.body}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="primary" onClick={onAction}>
          {texts.action}
        </Button>
        <Button variant="secondary" onClick={onStay}>
          {texts.stay}
        </Button>
      </div>
    </Dialog>
  )
}
