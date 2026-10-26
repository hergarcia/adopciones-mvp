'use client'

import { useState } from 'react'
import { changePetStatus } from '@/actions/pet-status'
import { usePetStatus, type PetStatusFailure, type PetStatusRefusal } from '@/hooks/use-pet-status'
import type { EndAdoptionTexts } from '@/components/adoptions/end-adoption-dialog'
import { actionsFor, leadActionFor } from '@/lib/pets/lifecycle'
import type { PetState, PetStatusAction } from '@/lib/pets/types'
import { DeletePetDialog, type DeletePetTexts } from './delete-pet-dialog'
import { PetStatusFailureStrip, PetStatusNotices } from './pet-status-feedback'
import { PetStatusSheet } from './pet-status-sheet'
import { StatusActionList, StatusButton } from './status-action-list'

export type PetStatusTexts = {
  name: string
  more: string
  close: string
  toastClose: string
  actions: Record<PetStatusAction, string>
  /** Cada una nombra el botón que se tocó: «Tocá «Pausar» de nuevo». */
  failures: Record<PetStatusFailure, Record<PetStatusAction, string>>
  refusals: Record<PetStatusRefusal, string>
  gate: { title: string; body: string; action: string; stay: string; close: string }
  delete: DeletePetTexts
  /** Un adoptado a una persona: «Volver a publicar» pide confirmar que la adopción termina (#67). */
  endAdoption?: EndAdoptionTexts | null
}

type Props = {
  petId: string
  state: PetState
  /** `card` debajo de una card, el resto detrás de «Más acciones»; `page` todo a la vista. */
  layout: 'card' | 'page'
  returnPath: string
  /** «¿A quién se lo diste?» con la vuelta a esta pantalla; se arma en el servidor (`handoverPath`). */
  handoverHref: string
  /** El aviso de verificación pendiente, con la vuelta a esta pantalla. */
  gateHref: string
  /** Ya traducidos, del animal. */
  texts: PetStatusTexts
  /** En la card, «Ver ficha» y «Compartir» antes de «Más acciones»; en su pantalla, antes de «Borrar». */
  links?: React.ReactNode
  /** Vence en 7 días o menos: «Renovar» es la acción que se destaca (US2). */
  expiresSoon?: boolean
}

// Las acciones del estado de un animal (spec #59, Edge Cases), una a la vez: mientras una corre, las
// demás esperan y un segundo toque no hace nada (FR-007). La que vuelve a poner a la vista, o
// «Renovar» si vence pronto (`leadActionFor`), va a la vista en la card y es la tirita de su
// pantalla. Un solo flujo para todas: el aviso de cómo terminó vive acá, que sigue montado cuando la
// pantalla se vuelve a dibujar y el botón destacado ya no está.
export function PetStatusActions({
  petId,
  state,
  layout,
  returnPath,
  handoverHref,
  gateHref,
  texts,
  links,
  expiresSoon = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const flow = usePetStatus<PetStatusAction>({
    run: (action) => changePetStatus({ petId, action }),
    returnPath,
    refusals: texts.refusals,
    onSettled: () => setOpen(false),
  })
  const lead = leadActionFor(state, expiresSoon)
  const endAdoption =
    texts.endAdoption === undefined || texts.endAdoption === null
      ? null
      : { action: 'republish' as const, texts: texts.endAdoption }
  const inList = actionsFor(state).filter((action) => layout === 'page' || action !== lead)

  const list = (
    <div className="flex w-full flex-col items-start gap-3">
      <StatusActionList
        flow={flow}
        actions={inList}
        labels={texts.actions}
        failures={texts.failures}
        lookOf={(action) => (layout === 'page' && action === lead ? 'tirita' : 'plain')}
        handoverHref={handoverHref}
        endAdoption={endAdoption}
      />
      {layout === 'page' ? links : null}
      <DeletePetDialog petId={petId} returnPath={returnPath} texts={texts.delete} />
    </div>
  )

  return (
    <>
      {layout === 'card' ? (
        <div className="flex w-full flex-col items-start gap-3">
          {lead === null ? null : (
            <StatusButton
              handoverHref={handoverHref}
              endAdoption={endAdoption}
              flow={flow}
              action={lead}
              label={texts.actions[lead]}
              look="lead"
            />
          )}
          {open ? null : <PetStatusFailureStrip flow={flow} failures={texts.failures} />}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {links}
            <PetStatusSheet
              open={open}
              onOpenChange={(next) => (flow.busy === null ? setOpen(next) : undefined)}
              texts={{ title: texts.name, trigger: texts.more, close: texts.close }}
            >
              {list}
            </PetStatusSheet>
          </div>
        </div>
      ) : (
        list
      )}
      <PetStatusNotices flow={flow} texts={texts} gateHref={gateHref} />
    </>
  )
}
