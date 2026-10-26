import {
  LITTER_STATES,
  YOUNG_STATES,
  type LitterState,
  type YoungDbAction,
  type YoungState,
} from '@/lib/litters/types'
import { SEXES, type Sex } from '@/lib/pets/options'
import { createServiceSupabase } from '@/lib/supabase/service'
import { oneOf } from './pet-rows'
import { STATUS_OUTCOMES, type StatusOutcome } from './pet-status'

// Las escrituras del estado de una camada y de sus crías (historia #206): funciones de la base con
// permisos de servicio y la dueña como parámetro, que comprueban adentro la propiedad y la
// transición con el candado de la cuenta (research R4). Una falla de la base lanza.

export type YoungStatusRecord =
  | { outcome: 'not_found' }
  | {
      outcome: Exclude<StatusOutcome, 'not_found' | 'needs_verification'>
      /** El de la camada: la cría no tiene ficha propia. */
      code: string
      litterId: string
      name: string
      sex: Sex
      litterName: string
      from: YoungState
      state: YoungState
      litterState: LitterState
      publishedAt: Date
      /** Marcarla disponible terminó la adopción a una persona: el día en que se marcó (#67, R6). */
      endedMarkedAt: Date | null
    }

export async function changeYoungStatusRecord(input: {
  ownerId: string
  petId: string
  action: YoungDbAction
}): Promise<YoungStatusRecord> {
  const { data, error } = await createServiceSupabase().rpc('change_young_status', {
    p_owner: input.ownerId,
    p_pet: input.petId,
    p_action: input.action,
  })
  const row = error ? undefined : data[0]
  if (row === undefined)
    throw new Error('No se pudo cambiar el estado de la cría', { cause: error })
  const outcome = oneOf(STATUS_OUTCOMES, row.outcome, 'resultado')
  if (outcome === 'not_found') return { outcome }
  if (outcome === 'needs_verification') throw new Error('Una cría no pide nivel 1')
  return {
    outcome,
    code: row.code,
    litterId: row.litter_id,
    name: row.name,
    sex: oneOf(SEXES, row.sex, 'sexo'),
    litterName: row.litter_name,
    from: oneOf(YOUNG_STATES, row.from_state, 'estado'),
    state: oneOf(YOUNG_STATES, row.state, 'estado'),
    litterState: oneOf(LITTER_STATES, row.litter_state, 'estado de la camada'),
    publishedAt: new Date(row.published_at),
    endedMarkedAt: row.ended_marked_at === null ? null : new Date(row.ended_marked_at),
  }
}
