import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import type { LeavingTexts } from './profile-form-types'

type Props = {
  open: boolean
  texts: LeavingTexts
  onStay: () => void
  onLeave: () => void
}

// Perder lo escrito no se deshace, que es para lo que docs/10 reserva el Dialog.
export function LeavingDialog({ open, texts, onStay, onLeave }: Props) {
  return (
    <Dialog open={open} onOpenChange={onStay} title={texts.title} closeLabel={texts.close}>
      <p className="text-base text-ink">{texts.body}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {/* Seguir editando primero: es lo que quiere quien llegó acá sin querer. */}
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
