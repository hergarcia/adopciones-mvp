'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { usePetStatus, type PetStatusFailure, type PetStatusRefusal } from '@/hooks/use-pet-status'
import { actionsFor } from '@/lib/pets/lifecycle'
import type { PetState, PetStatusAction } from '@/lib/pets/types'
import { DeletePetDialog, type DeletePetTexts } from './delete-pet-dialog'
import { PetStatusNotices, PetStatusRetry } from './pet-status-feedback'
import { PetStatusSheet } from './pet-status-sheet'

export type PetStatusTexts = {
  name: string
  more: string
  close: string
  toastClose: string
  retry: string
  actions: Record<PetStatusAction, string>
  failures: Record<PetStatusFailure, string>
  refusals: Record<PetStatusRefusal, string>
  gate: { title: string; body: string; action: string; stay: string; close: string }
  delete: DeletePetTexts
}

type Props = {
  petId: string
  state: PetState
  /** `sheet` debajo de una card, detrás de «Más acciones»; `page` a la vista, en su pantalla. */
  layout: 'sheet' | 'page'
  returnPath: string
  /** El aviso de verificación pendiente, con la vuelta a esta pantalla. */
  gateHref: string
  /** Ya traducidos, del animal. */
  texts: PetStatusTexts
  /** En su pantalla, «Ver ficha», «Compartir» y «Editar» van antes de «Borrar». */
  links?: React.ReactNode
  /** Vence en 7 días o menos: en su pantalla, «Renovar» es la acción que se destaca (US2). */
  expiresSoon?: boolean
}

// Lo que vuelve a poner un animal a la vista es la acción de su pantalla (plan §Diseño).
const PUTS_ON_VIEW: readonly PetStatusAction[] = ['resume', 'republish']

function leadsPage(action: PetStatusAction, expiresSoon: boolean): boolean {
  return PUTS_ON_VIEW.includes(action) || (expiresSoon && action === 'renew')
}

// Las acciones del estado de un animal (spec #59, Edge Cases), una a la vez: mientras una corre, las
// demás esperan y un segundo toque no hace nada (FR-007). El aviso y el de verificación pendiente
// quedan fuera de la hoja, que se cierra para mostrar cómo quedó el animal.
export function PetStatusActions({
  petId,
  state,
  layout,
  returnPath,
  gateHref,
  texts,
  links,
  expiresSoon = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const flow = usePetStatus({
    petId,
    returnPath,
    refusals: texts.refusals,
    onSettled: () => setOpen(false),
  })

  const list = (
    <div className="flex w-full flex-col items-start gap-3">
      <PetStatusRetry flow={flow} texts={texts} />
      {actionsFor(state).map((action, index) => {
        const leads = layout === 'page' && index === 0 && leadsPage(action, expiresSoon)
        return (
          <Button
            key={action}
            variant={leads ? 'tirita' : 'secondary'}
            size={leads ? 'lg' : 'md'}
            className={leads ? 'md:w-auto' : undefined}
            loading={flow.busy === action}
            disabled={flow.busy !== null && flow.busy !== action}
            onClick={() => void flow.run(action)}
          >
            {texts.actions[action]}
          </Button>
        )
      })}
      {links}
      <DeletePetDialog petId={petId} returnPath={returnPath} texts={texts.delete} />
    </div>
  )

  return (
    <>
      {layout === 'sheet' ? (
        <PetStatusSheet
          open={open}
          onOpenChange={(next) => (flow.busy === null ? setOpen(next) : undefined)}
          texts={{ title: texts.name, trigger: texts.more, close: texts.close }}
        >
          {list}
        </PetStatusSheet>
      ) : (
        list
      )}
      <PetStatusNotices flow={flow} texts={texts} gateHref={gateHref} />
    </>
  )
}
