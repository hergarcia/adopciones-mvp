'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { ActionResult } from '@/actions/result'
import { signInWithNext } from '@/lib/auth/next-destination'
import { raceDeadline } from '@/lib/forms/action-deadline'
import { SAVE_DEADLINE_MS } from '@/lib/profile/save-failure'

/** Lo que no llegó: se dice adentro, nombrando el botón que se tocó (FR-007). */
export type PetStatusFailure = 'offline' | 'no_response'

/** El aviso corto de cómo terminó, con su banda: yerba si salió, ceibo si no se aplicó. */
export type PetStatusToast = { message: string; variant: 'success' | 'error'; key: number }

/** Los rechazos que se dicen en un aviso: la pantalla se vuelve a dibujar con el estado de ahora. */
export type PetStatusRefusal = 'changed' | 'taken_down' | 'not_found'

const REFUSALS: readonly string[] = ['changed', 'taken_down', 'not_found']

const isRefusal = (kind: string): kind is PetStatusRefusal => REFUSALS.includes(kind)

/** Una acción que no respondió: sin conexión o el sitio que no contestó. */
export function failureOf(kind: 'threw' | 'timeout'): PetStatusFailure {
  return kind === 'threw' && !navigator.onLine ? 'offline' : 'no_response'
}

/** La acción del servidor que corre un cambio de estado: la de un animal, una cría o una camada. */
export type StatusRun<A extends string> = (
  action: A,
) => Promise<ActionResult<{ notice: string }, unknown>>

type Options<A extends string> = {
  run: StatusRun<A>
  /** La pantalla a la que se vuelve después de ingresar o de confirmar el teléfono. */
  returnPath: string
  /** Ya traducidos, del sujeto: lo que dice el aviso de un rechazo. */
  refusals: Record<PetStatusRefusal, string>
  /** Se aplicó o se rechazó: la hoja se cierra para mostrar cómo quedó. */
  onSettled?: () => void
}

export type StatusFlow<A extends string> = {
  busy: A | null
  failure: { kind: PetStatusFailure; action: A; attempt: number } | null
  toast: PetStatusToast | null
  needsPhone: boolean
  run: (action: A) => Promise<void>
  closeToast: () => void
  closePhone: () => void
}

// Las acciones de estado de «Mis animales», de un animal, de una cría o de una camada (research R10
// de la #206). Sin conexión y sin respuesta son dos mensajes distintos y el sujeto queda como estaba;
// el aviso nombra el botón que se tocó, que se vuelve a tocar, y la base no aplica la acción dos
// veces (FR-007). Falta el teléfono: el aviso de verificación pendiente. Cambió mientras tanto: la
// pantalla se vuelve a dibujar y un aviso lo dice. El rechazo se reconoce por el final de su clave,
// que es el mismo en `pets.status.errors` y en `litters.status.errors`.
export function usePetStatus<A extends string>({
  run,
  returnPath,
  refusals,
  onSettled,
}: Options<A>): StatusFlow<A> {
  const router = useRouter()
  const [busy, setBusy] = useState<A | null>(null)
  const [failure, setFailure] = useState<StatusFlow<A>['failure']>(null)
  const [toast, setToast] = useState<PetStatusToast | null>(null)
  const [needsPhone, setNeedsPhone] = useState(false)

  function fail(kind: PetStatusFailure, action: A) {
    setFailure((previous) => ({ kind, action, attempt: (previous?.attempt ?? 0) + 1 }))
  }

  async function start(action: A) {
    if (busy !== null) return
    setBusy(action)
    const outcome = navigator.onLine
      ? await raceDeadline(run(action), SAVE_DEADLINE_MS)
      : ({ kind: 'threw' } as const)
    setBusy(null)

    if (outcome.kind !== 'result') {
      fail(failureOf(outcome.kind), action)
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
    const kind = result.error.slice(result.error.lastIndexOf('.') + 1)
    if (kind === 'session') {
      router.push(signInWithNext(returnPath))
      return
    }
    if (kind === 'needs_verification') {
      onSettled?.()
      setNeedsPhone(true)
      return
    }
    if (!isRefusal(kind)) {
      fail('no_response', action)
      return
    }
    setToast({ message: refusals[kind], variant: 'error', key: Date.now() })
    onSettled?.()
    router.refresh()
  }

  return {
    busy,
    failure,
    toast,
    needsPhone,
    run: start,
    closeToast: () => setToast(null),
    closePhone: () => setNeedsPhone(false),
  }
}
