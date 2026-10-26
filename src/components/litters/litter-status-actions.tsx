'use client'

import { useRef, useState } from 'react'
import { changeLitterStatus } from '@/actions/litter-status'
import type { DeletePetTexts } from '@/components/pets/delete-pet-dialog'
import { PetStatusFailureStrip, PetStatusNotices } from '@/components/pets/pet-status-feedback'
import { PetStatusSheet } from '@/components/pets/pet-status-sheet'
import { STATUS_LOOKS, StatusButton, type StatusLook } from '@/components/pets/status-action-list'
import { usePetStatus, type PetStatusFailure, type PetStatusRefusal } from '@/hooks/use-pet-status'
import { actionsForLitter, leadActionForLitter } from '@/lib/litters/lifecycle'
import type { LitterState, LitterStatusAction } from '@/lib/litters/types'
import { DeleteLitterDialog } from './delete-litter-dialog'
import { RepublishLitterDialog, type RepublishLitterTexts } from './republish-litter-dialog'

export type LitterStatusTexts = {
  name: string
  more: string
  close: string
  toastClose: string
  actions: Record<LitterStatusAction, string>
  failures: Record<PetStatusFailure, Record<LitterStatusAction, string>>
  refusals: Record<PetStatusRefusal, string>
  gate: { title: string; body: string; action: string; stay: string; close: string }
  delete: DeletePetTexts
  /** Una camada adoptada: qué crías vuelven a ofrecerse (FR-006). */
  republish: RepublishLitterTexts | null
}

type Props = {
  litterId: string
  state: LitterState
  /** `card` debajo de la camada en «Mis animales», el resto en la hoja; `page` todo a la vista. */
  layout: 'card' | 'page'
  returnPath: string
  gateHref: string
  texts: LitterStatusTexts
  /** «Ver ficha», «Compartir» y «Editar»: antes de la hoja en la card, antes de borrar en el panel. */
  links?: React.ReactNode
  /** Vence en 7 días o menos: «Renovar» es la que se destaca. */
  expiresSoon?: boolean
}

// Las acciones de la camada entera (spec, Edge Cases) con el flujo de las de un animal: una a la vez,
// el aviso de cómo terminó y, sin nivel 1, el de verificación pendiente (FR-004, FR-009). La que vuelve
// a poner la camada a la vista, o «Renovar» si vence pronto, va a la vista en la card y es la tirita de
// su panel. Volver a publicar una adoptada pide elegir las crías antes de correr (FR-006).
export function LitterStatusActions({
  litterId,
  state,
  layout,
  returnPath,
  gateHref,
  texts,
  links,
  expiresSoon = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const chosen = useRef<string[]>([])
  const choosing = state === 'adopted' ? texts.republish : null
  const flow = usePetStatus<LitterStatusAction>({
    run: (action) =>
      changeLitterStatus(
        action === 'republish' && choosing !== null
          ? { litterId, action, youngIds: chosen.current }
          : { litterId, action },
      ),
    returnPath,
    refusals: texts.refusals,
    onSettled: () => setOpen(false),
  })
  const lead = leadActionForLitter(state, expiresSoon)

  function button(action: LitterStatusAction, look: StatusLook) {
    if (action === 'republish' && choosing !== null) {
      const { variant, size, className } = STATUS_LOOKS[look]
      return (
        <RepublishLitterDialog
          key={action}
          trigger={{
            label: texts.actions.republish,
            variant,
            size,
            className,
            loading: flow.busy === 'republish',
            disabled: flow.busy !== null && flow.busy !== 'republish',
          }}
          texts={choosing}
          onConfirm={(youngIds) => {
            chosen.current = youngIds
            void flow.run('republish')
          }}
        />
      )
    }
    return (
      <StatusButton
        key={action}
        handoverHref=""
        endAdoption={null}
        flow={flow}
        action={action}
        label={texts.actions[action]}
        look={look}
      />
    )
  }

  const actions = actionsForLitter(state)
  const inList = actions.filter((action) => layout === 'page' || action !== lead)
  const list = (
    <div className="flex w-full flex-col items-start gap-3">
      {layout === 'page' || open ? (
        <PetStatusFailureStrip flow={flow} failures={texts.failures} />
      ) : null}
      {inList.map((action) =>
        button(action, layout === 'page' && action === lead ? 'tirita' : 'plain'),
      )}
      {layout === 'page' ? links : null}
      <DeleteLitterDialog litterId={litterId} returnPath={returnPath} texts={texts.delete} />
    </div>
  )

  return (
    <>
      {layout === 'card' ? (
        <div className="flex w-full flex-col items-start gap-3">
          {lead === null ? null : button(lead, 'lead')}
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
