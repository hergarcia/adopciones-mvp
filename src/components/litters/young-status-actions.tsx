'use client'

import { useState } from 'react'
import { changeYoungStatus } from '@/actions/litter-status'
import type { EndAdoptionTexts } from '@/components/adoptions/end-adoption-dialog'
import { PetStatusFailureStrip, PetStatusNotices } from '@/components/pets/pet-status-feedback'
import { PetStatusSheet } from '@/components/pets/pet-status-sheet'
import { StatusActionList } from '@/components/pets/status-action-list'
import { usePetStatus, type PetStatusFailure, type PetStatusRefusal } from '@/hooks/use-pet-status'
import { actionsForYoung } from '@/lib/litters/lifecycle'
import type { LitterState, YoungState, YoungStatusAction } from '@/lib/litters/types'

// «Marcar adoptada» es un enlace y nunca corre como acción: si llegara, no se aplica nada.
const NOT_RUN = 'litters.status.errors.failed'

export type YoungStatusTexts = {
  name: string
  more: string
  close: string
  toastClose: string
  actions: Record<YoungStatusAction, string>
  failures: Record<PetStatusFailure, Record<YoungStatusAction, string>>
  refusals: Record<PetStatusRefusal, string>
  gate: { title: string; body: string; action: string; stay: string; close: string }
  /** Una adoptada a una persona: «Marcar disponible» pide confirmar que la adopción termina. */
  endAdoption: EndAdoptionTexts | null
}

type Props = {
  petId: string
  state: YoungState
  litterState: LitterState
  /** `sheet` en la fila de «Mis animales», detrás de «Acciones»; `row` a la vista, en su panel. */
  layout: 'sheet' | 'row'
  returnPath: string
  /** «¿A quién se la diste?» de esta cría, con la vuelta a esta pantalla. */
  handoverHref: string
  gateHref: string
  texts: YoungStatusTexts
  /** «Quitar» (`RemoveYoungAction`), al final; no está con la camada dada de baja. */
  remove?: React.ReactNode
}

// Las acciones de una cría según su estado y el de su camada (spec, Edge Cases), con el flujo de las
// de un animal: una a la vez, el aviso de cómo terminó y, si cambió mientras tanto, cómo quedó
// (FR-009). Quitar vale en todos los estados salvo con la camada dada de baja, donde no queda nada.
export function YoungStatusActions({
  petId,
  state,
  litterState,
  layout,
  returnPath,
  handoverHref,
  gateHref,
  texts,
  remove = null,
}: Props) {
  const [open, setOpen] = useState(false)
  const flow = usePetStatus<YoungStatusAction>({
    run: (action) =>
      action === 'mark_adopted'
        ? Promise.resolve({ ok: false, error: NOT_RUN })
        : changeYoungStatus({ petId, action }),
    returnPath,
    refusals: texts.refusals,
    onSettled: () => setOpen(false),
  })
  const actions = actionsForYoung(state, litterState)
  if (actions.length === 0 && remove === null)
    return <PetStatusNotices flow={flow} texts={texts} gateHref={gateHref} />

  const list = (
    <StatusActionList
      flow={flow}
      actions={actions}
      labels={texts.actions}
      failures={texts.failures}
      lookOf={() => (layout === 'row' ? 'small' : 'plain')}
      handoverHref={handoverHref}
      endAdoption={
        texts.endAdoption === null ? null : { action: 'mark_available', texts: texts.endAdoption }
      }
      showFailure={layout === 'row' || open}
    />
  )

  return (
    <>
      {layout === 'row' ? (
        <div className="flex flex-wrap items-center gap-3">
          {list}
          {remove}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-1">
          {open ? null : <PetStatusFailureStrip flow={flow} failures={texts.failures} />}
          <PetStatusSheet
            open={open}
            onOpenChange={(next) => (flow.busy === null ? setOpen(next) : undefined)}
            texts={{ title: texts.name, trigger: texts.more, close: texts.close }}
          >
            <div className="flex w-full flex-col items-start gap-3">
              {list}
              {remove}
            </div>
          </PetStatusSheet>
        </div>
      )}
      <PetStatusNotices flow={flow} texts={texts} gateHref={gateHref} />
    </>
  )
}
