'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SaveFailedStrip } from '@/components/forms/save-failed-strip'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'
import { usePetStatus, type PetStatusFailure, type PetStatusRefusal } from '@/hooks/use-pet-status'
import { actionsFor } from '@/lib/pets/lifecycle'
import type { PetState, PetStatusAction } from '@/lib/pets/types'
import { DeletePetDialog, type DeletePetTexts } from './delete-pet-dialog'
import { PetStatusSheet } from './pet-status-sheet'
import { SaveBlockedDialog } from './save-blocked-dialog'

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
}

// Lo que vuelve a poner un animal a la vista es la acción de su pantalla (plan §Diseño).
const PUTS_ON_VIEW: readonly PetStatusAction[] = ['resume', 'republish']

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
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const flow = usePetStatus({
    petId,
    returnPath,
    refusals: texts.refusals,
    onSettled: () => setOpen(false),
  })

  const list = (
    <div className="flex w-full flex-col items-start gap-3">
      {flow.failure ? (
        <div className="flex w-full flex-col items-start gap-2">
          <SaveFailedStrip
            message={texts.failures[flow.failure.kind]}
            attempt={flow.failure.attempt}
          />
          <Button variant="ghost" size="sm" onClick={flow.retry} disabled={flow.busy !== null}>
            {texts.retry}
          </Button>
        </div>
      ) : null}
      {actionsFor(state).map((action, index) => {
        const leads = layout === 'page' && index === 0 && PUTS_ON_VIEW.includes(action)
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
      {flow.toast ? (
        <Toast
          key={flow.toast.key}
          open
          onOpenChange={(next) => (next ? undefined : flow.closeToast())}
          message={flow.toast.message}
          variant={flow.toast.variant}
          closeLabel={texts.toastClose}
        />
      ) : null}
      <SaveBlockedDialog
        open={flow.needsPhone}
        texts={texts.gate}
        onAction={() => router.push(gateHref)}
        onStay={flow.closePhone}
      />
    </>
  )
}
