import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import type { LeavingLoss } from '@/lib/profile/leaving-loss'
import type { LeavingTexts } from './profile-form-types'

type Props = {
  /** Lo que se pierde al salir: sin nada que perder no frena nada, y el texto dice solo eso. */
  loss: LeavingLoss
  /** Con un guardado en curso, salir es lo que se espera que pase. */
  saving: boolean
  texts: LeavingTexts
}

// Perder lo escrito no se deshace, que es para lo que docs/10 reserva el Dialog.
export function LeavingDialog({ loss, saving, texts }: Props) {
  const { leavingTo, leave, stay } = useUnsavedChanges(loss !== 'nothing' && !saving)

  return (
    <Dialog
      open={leavingTo !== null}
      onOpenChange={stay}
      title={texts.title}
      closeLabel={texts.close}
    >
      <p className="text-base text-ink">{loss === 'photo' ? texts.bodyPhoto : texts.body}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {/* Seguir editando primero: es lo que quiere quien llegó acá sin querer. */}
        <Button variant="primary" onClick={stay}>
          {texts.stay}
        </Button>
        <Button variant="secondary" onClick={leave}>
          {texts.leave}
        </Button>
      </div>
    </Dialog>
  )
}
