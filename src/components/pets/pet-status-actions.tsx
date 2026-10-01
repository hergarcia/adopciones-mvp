'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  usePetStatus,
  type PetStatusFailure,
  type PetStatusFlow,
  type PetStatusRefusal,
} from '@/hooks/use-pet-status'
import { actionsFor, leadActionFor } from '@/lib/pets/lifecycle'
import type { PetState, PetStatusAction } from '@/lib/pets/types'
import { DeletePetDialog, type DeletePetTexts } from './delete-pet-dialog'
import { PetStatusFailureStrip, PetStatusNotices } from './pet-status-feedback'
import { PetStatusSheet } from './pet-status-sheet'

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
}

type Props = {
  petId: string
  state: PetState
  /** `card` debajo de una card, el resto detrás de «Más acciones»; `page` todo a la vista. */
  layout: 'card' | 'page'
  returnPath: string
  /** El aviso de verificación pendiente, con la vuelta a esta pantalla. */
  gateHref: string
  /** Ya traducidos, del animal. */
  texts: PetStatusTexts
  /** En la card, «Ver ficha» y «Compartir» antes de «Más acciones»; en su pantalla, antes de «Borrar». */
  links?: React.ReactNode
  /** Vence en 7 días o menos: «Renovar» es la acción que se destaca (US2). */
  expiresSoon?: boolean
}

type StatusButtonProps = {
  flow: PetStatusFlow
  action: PetStatusAction
  label: string
  look: 'tirita' | 'lead' | 'plain'
}

const LOOKS = {
  tirita: { variant: 'tirita', size: 'lg', className: 'md:w-auto' },
  lead: { variant: 'secondary', size: 'sm', className: undefined },
  plain: { variant: 'secondary', size: 'md', className: undefined },
} as const

function StatusButton({ flow, action, label, look }: StatusButtonProps) {
  const { variant, size, className } = LOOKS[look]
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      loading={flow.busy === action}
      disabled={flow.busy !== null && flow.busy !== action}
      onClick={() => void flow.run(action)}
    >
      {label}
    </Button>
  )
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
  const lead = leadActionFor(state, expiresSoon)
  const inList = actionsFor(state).filter((action) => layout === 'page' || action !== lead)

  const list = (
    <div className="flex w-full flex-col items-start gap-3">
      <PetStatusFailureStrip flow={flow} texts={texts} />
      {inList.map((action) => (
        <StatusButton
          key={action}
          flow={flow}
          action={action}
          label={texts.actions[action]}
          look={layout === 'page' && action === lead ? 'tirita' : 'plain'}
        />
      ))}
      {layout === 'page' ? links : null}
      <DeletePetDialog petId={petId} returnPath={returnPath} texts={texts.delete} />
    </div>
  )

  return (
    <>
      {layout === 'card' ? (
        <div className="flex w-full flex-col items-start gap-3">
          {lead === null ? null : (
            <StatusButton flow={flow} action={lead} label={texts.actions[lead]} look="lead" />
          )}
          {open ? null : <PetStatusFailureStrip flow={flow} texts={texts} />}
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
