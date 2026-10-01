'use client'

import { Button } from '@/components/ui/button'
import { usePetStatus } from '@/hooks/use-pet-status'
import type { PetStatusTexts } from './pet-status-actions'
import { PetStatusNotices, PetStatusRetry } from './pet-status-feedback'

type Props = {
  petId: string
  returnPath: string
  gateHref: string
  /** Ya traducidos, del animal: los mismos de sus otras acciones. */
  texts: PetStatusTexts
}

// «Renovar» a la vista cuando un animal vence pronto (US2): lo único que le pide la pantalla al
// rescatista. La misma acción que en «Más acciones», con sus mismos avisos.
export function RenewButton({ petId, returnPath, gateHref, texts }: Props) {
  const flow = usePetStatus({ petId, returnPath, refusals: texts.refusals })
  return (
    <div className="flex w-full flex-col items-start gap-2">
      <Button
        variant="secondary"
        size="sm"
        loading={flow.busy === 'renew'}
        onClick={() => void flow.run('renew')}
      >
        {texts.actions.renew}
      </Button>
      <PetStatusRetry flow={flow} texts={texts} />
      <PetStatusNotices flow={flow} texts={texts} gateHref={gateHref} />
    </div>
  )
}
