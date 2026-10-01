'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { changePetStatus } from '@/actions/pet-status'
import { signInWithNext } from '@/lib/auth/next-destination'
import { raceDeadline } from '@/lib/forms/action-deadline'
import type { PetStatusAction } from '@/lib/pets/types'
import { SAVE_DEADLINE_MS } from '@/lib/profile/save-failure'

/** Lo que no llegó: se dice adentro, con «Reintentar» (FR-007). */
export type PetStatusFailure = 'offline' | 'no_response'

/** El aviso corto de cómo terminó, con su banda: yerba si salió, ceibo si no se aplicó. */
export type PetStatusToast = { message: string; variant: 'success' | 'error'; key: number }

/** Los rechazos que se dicen en un aviso: la pantalla se vuelve a dibujar con el estado de ahora. */
export type PetStatusRefusal = 'changed' | 'taken_down' | 'not_found'

/** Una acción que no respondió: sin conexión o el sitio que no contestó. */
export function failureOf(kind: 'threw' | 'timeout'): PetStatusFailure {
  return kind === 'threw' && !navigator.onLine ? 'offline' : 'no_response'
}

const REFUSALS: Record<string, PetStatusRefusal> = {
  'pets.status.errors.changed': 'changed',
  'pets.status.errors.taken_down': 'taken_down',
  'pets.status.errors.not_found': 'not_found',
}

type Options = {
  petId: string
  /** La pantalla a la que se vuelve después de ingresar o de confirmar el teléfono. */
  returnPath: string
  /** Ya traducidos, del animal: lo que dice el aviso de un rechazo. */
  refusals: Record<PetStatusRefusal, string>
  /** Se aplicó o se rechazó: la hoja se cierra para mostrar cómo quedó. */
  onSettled?: () => void
}

// Las acciones de «Mis animales» sobre un animal (contracts §Server Actions). Sin conexión y sin
// respuesta son dos mensajes distintos y el animal queda como estaba; reintentar repite la misma
// acción, y la base no la aplica dos veces (FR-007). Falta el teléfono: el aviso de verificación
// pendiente. Cambió mientras tanto: la pantalla se vuelve a dibujar y un aviso lo dice.
export function usePetStatus({ petId, returnPath, refusals, onSettled }: Options) {
  const router = useRouter()
  const [busy, setBusy] = useState<PetStatusAction | null>(null)
  const [failure, setFailure] = useState<{ kind: PetStatusFailure; attempt: number } | null>(null)
  const [last, setLast] = useState<PetStatusAction | null>(null)
  const [toast, setToast] = useState<PetStatusToast | null>(null)
  const [needsPhone, setNeedsPhone] = useState(false)

  function fail(kind: PetStatusFailure) {
    setFailure((previous) => ({ kind, attempt: (previous?.attempt ?? 0) + 1 }))
  }

  async function run(action: PetStatusAction) {
    if (busy !== null) return
    setBusy(action)
    setLast(action)
    const outcome = navigator.onLine
      ? await raceDeadline(changePetStatus({ petId, action }), SAVE_DEADLINE_MS)
      : ({ kind: 'threw' } as const)
    setBusy(null)

    if (outcome.kind !== 'result') {
      fail(failureOf(outcome.kind))
      return
    }
    const { result } = outcome
    setFailure(null)
    if (result.ok) {
      setToast({ message: result.data.notice, variant: 'success', key: Date.now() })
      onSettled?.()
      router.refresh()
      return
    }
    if (result.error === 'pets.status.errors.session') {
      router.push(signInWithNext(returnPath))
      return
    }
    if (result.error === 'pets.status.errors.needs_verification') {
      onSettled?.()
      setNeedsPhone(true)
      return
    }
    const refusal = REFUSALS[result.error]
    if (refusal === undefined) {
      fail('no_response')
      return
    }
    setToast({ message: refusals[refusal], variant: 'error', key: Date.now() })
    onSettled?.()
    router.refresh()
  }

  return {
    busy,
    failure,
    toast,
    needsPhone,
    run,
    retry: () => (last === null ? undefined : void run(last)),
    closeToast: () => setToast(null),
    closePhone: () => setNeedsPhone(false),
  }
}

export type PetStatusFlow = ReturnType<typeof usePetStatus>
