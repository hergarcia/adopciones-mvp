import { uruguayDay } from './age'
import { PET_REMINDER_DAYS } from './rules'
import type { PetState, PetStatus, PetStatusAction } from './types'

const DAY_MS = 86_400_000

type Stored = {
  status: PetStatus
  expiresAt: Date | null
  takenDownAt: Date | null
}

// La misma cuenta que `private.pet_state` de la base, con un test de paridad (research R1): dada de
// baja gana a todo, y una disponible o en proceso vence en el instante exacto de su vencimiento.
export function lifecycleOf(pet: Stored, now: Date): PetState {
  if (pet.takenDownAt !== null) return 'taken_down'
  const running = pet.status === 'available' || pet.status === 'in_process'
  if (running && pet.expiresAt !== null && pet.expiresAt <= now) return 'expired'
  return pet.status
}

// Primero la que pone el animal a la vista, después la que lo marca, pausar y adoptado (plan
// §Diseño). Son exactamente las celdas de la tabla de `change_pet_status` que hacen algo; borrar
// vale en todos los estados y no está en la lista.
const ACTIONS: Record<PetState, readonly PetStatusAction[]> = {
  available: ['renew', 'mark_in_process', 'pause', 'mark_adopted'],
  in_process: ['renew', 'mark_available', 'pause', 'mark_adopted'],
  paused: ['resume', 'mark_adopted'],
  adopted: ['republish'],
  expired: ['republish', 'mark_adopted'],
  taken_down: [],
}

export function actionsFor(state: PetState): readonly PetStatusAction[] {
  return ACTIONS[state]
}

// Lo que vuelve a poner un animal a la vista exige el teléfono verificado (FR-003).
export function needsLevelOne(action: PetStatusAction): boolean {
  return action === 'resume' || action === 'renew' || action === 'republish'
}

export type ExpiryView =
  { kind: 'expires'; day: string; soon: boolean } | { kind: 'expired'; day: string } | null

// La línea de vencimiento de «Mis animales»: el día de Uruguay en que vence, próximo con 7 días o
// menos; vencida, el día en que venció; pausada, adoptada o dada de baja, nada.
export function expiryView(state: PetState, expiresAt: Date | null, now: Date): ExpiryView {
  if (expiresAt === null) return null
  const day = uruguayDay(expiresAt)
  if (state === 'expired') return { kind: 'expired', day }
  if (state !== 'available' && state !== 'in_process') return null
  const soon = expiresAt.getTime() - now.getTime() <= PET_REMINDER_DAYS * DAY_MS
  return { kind: 'expires', day, soon }
}
