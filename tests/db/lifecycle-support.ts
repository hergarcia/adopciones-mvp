// Lo que comparten las pruebas del ciclo de vida de una publicación (historia #59): poner un animal
// en cada estado escribiendo la fila con permisos de servicio, mover su vencimiento, y las acciones
// llamadas como las llama la aplicación.
import { expect } from 'vitest'
import { PET_LIFETIME_DAYS } from '../../src/lib/pets/rules'
import type { PetState, PetStatusAction } from '../../src/lib/pets/types'
import type { Database } from '../../src/lib/supabase/types'
import { PENDING_TTL } from './pet-support'
import { db } from './phone-support'
import { serviceClient } from './roles'

const DAY_MS = 86_400_000
export const inDays = (days: number) => new Date(Date.now() + days * DAY_MS).toISOString()

// Cada estado es la fila que dejaría el sitio, escrita directo: vencida es una disponible cuyo
// vencimiento ya pasó, y dada de baja, una con la baja y su motivo.
const ROWS: Record<PetState, Database['public']['Tables']['pets']['Update']> = {
  available: { status: 'available', expires_at: inDays(10) },
  in_process: { status: 'in_process', expires_at: inDays(10) },
  paused: { status: 'paused', expires_at: null },
  adopted: { status: 'adopted', expires_at: null },
  expired: { status: 'available', expires_at: inDays(-1) },
  taken_down: {
    status: 'available',
    expires_at: inDays(10),
    taken_down_at: inDays(-1),
    takedown_reason: 'other',
    takedown_note: 'Tenía un teléfono escrito en la foto.',
  },
}

export async function setState(petId: string, state: PetState) {
  const { error } = await db().from('pets').update(ROWS[state]).eq('id', petId)
  expect(error).toBeNull()
}

export async function setExpiry(petId: string, expiresAt: string) {
  const { error } = await db().from('pets').update({ expires_at: expiresAt }).eq('id', petId)
  expect(error).toBeNull()
}

export type StatusRow = {
  outcome: string
  code: string | null
  name: string | null
  sex: string | null
  from_state: string | null
  state: string | null
  expires_at: string | null
  published_at: string | null
  ended_marked_at: string | null
}

export async function change(ownerId: string, petId: string, action: string) {
  const { data, error } = await serviceClient().rpc('change_pet_status', {
    p_owner: ownerId,
    p_pet: petId,
    p_action: action,
    p_pending_ttl: PENDING_TTL,
  })
  const rows: StatusRow[] = data ?? []
  return { row: rows[0], error }
}

export async function changed(ownerId: string, petId: string, action: PetStatusAction) {
  const { row, error } = await change(ownerId, petId, action)
  expect(error).toBeNull()
  if (row === undefined) throw new Error('change_pet_status no devolvió ninguna fila')
  return row
}

export async function petRow(petId: string) {
  const { data } = await db().from('pets').select('*').eq('id', petId).maybeSingle()
  return data
}

/** Milisegundos entre un instante de la base y lo que se espera, para comparar con margen. */
export function msFrom(value: string | null | undefined, expected: number): number {
  return Math.abs(new Date(String(value)).getTime() - expected)
}

export const LIFETIME_MS = PET_LIFETIME_DAYS * DAY_MS
