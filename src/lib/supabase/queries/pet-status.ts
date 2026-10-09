import { SEXES, type Sex } from '@/lib/pets/options'
import { PET_STATES, type PetState, type PetStatusAction } from '@/lib/pets/types'
import { createServiceSupabase } from '@/lib/supabase/service'
import { DB_RULES } from '@/lib/verification/rules'
import { oneOf } from './pet-rows'

// Las escrituras del ciclo de vida (historia #59): funciones de la base con permisos de servicio y
// la dueña como parámetro, que comprueban adentro la propiedad, el nivel 1 y la transición con el
// candado de la cuenta (research R2). Una falla de la base lanza; los resultados conocidos vuelven.

export const STATUS_OUTCOMES = [
  'done',
  'already',
  'changed',
  'needs_verification',
  'taken_down',
  'not_found',
] as const
export type StatusOutcome = (typeof STATUS_OUTCOMES)[number]

export type StatusChangeRecord =
  | { outcome: 'not_found' }
  | {
      outcome: Exclude<StatusOutcome, 'not_found'>
      code: string
      name: string
      sex: Sex
      from: PetState
      state: PetState
      expiresAt: Date | null
      publishedAt: Date
      /** Volver a publicar terminó una adopción a una persona: el día en que se marcó (R6). */
      endedMarkedAt: Date | null
    }

export async function changePetStatusRecord(input: {
  ownerId: string
  petId: string
  action: PetStatusAction
}): Promise<StatusChangeRecord> {
  const { data, error } = await createServiceSupabase().rpc('change_pet_status', {
    p_owner: input.ownerId,
    p_pet: input.petId,
    p_action: input.action,
    p_pending_ttl: DB_RULES.p_pending_ttl,
  })
  const row = error ? undefined : data[0]
  if (row === undefined) throw new Error('No se pudo cambiar el estado', { cause: error })
  const outcome = oneOf(STATUS_OUTCOMES, row.outcome, 'resultado')
  if (outcome === 'not_found') return { outcome }
  return {
    outcome,
    code: row.code,
    name: row.name,
    sex: oneOf(SEXES, row.sex, 'sexo'),
    from: oneOf(PET_STATES, row.from_state, 'estado'),
    state: oneOf(PET_STATES, row.state, 'estado'),
    expiresAt: row.expires_at === null ? null : new Date(row.expires_at),
    publishedAt: new Date(row.published_at),
    endedMarkedAt: row.ended_marked_at === null ? null : new Date(row.ended_marked_at),
  }
}

/** Las fotos de un animal propio, para borrar sus objetos antes que la fila. Vacío si no es suyo. */
export async function petPhotoIds(ownerId: string, petId: string): Promise<string[]> {
  const { data, error } = await createServiceSupabase().rpc('pet_photo_ids', {
    p_owner: ownerId,
    p_pet: petId,
  })
  if (error) throw new Error('No se pudieron leer las fotos', { cause: error })
  return data
}

export type DeleteRecord =
  { outcome: 'not_found' } | { outcome: 'done'; code: string; from: PetState }

export async function deletePetRecord(ownerId: string, petId: string): Promise<DeleteRecord> {
  const { data, error } = await createServiceSupabase().rpc('delete_pet', {
    p_owner: ownerId,
    p_pet: petId,
  })
  const row = error ? undefined : data[0]
  if (row === undefined) throw new Error('No se pudo borrar el animal', { cause: error })
  if (row.outcome !== 'done') return { outcome: 'not_found' }
  return { outcome: 'done', code: row.code, from: oneOf(PET_STATES, row.from_state, 'estado') }
}
