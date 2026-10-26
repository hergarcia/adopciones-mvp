import {
  LITTER_STATES,
  type LitterStatusAction,
  YOUNG_STATES,
  type LitterState,
  type YoungDbAction,
  type YoungState,
} from '@/lib/litters/types'
import { SEXES, type Sex } from '@/lib/pets/options'
import { DB_RULES } from '@/lib/verification/rules'
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

export type LitterStatusRecord =
  | { outcome: 'not_found' }
  | {
      outcome: Exclude<StatusOutcome, 'not_found'>
      code: string
      name: string
      from: LitterState
      state: LitterState
      expiresAt: Date
      publishedAt: Date
      /** Volver a publicar una adoptada terminó adopciones a personas: el día en que se marcó cada una. */
      endedMarkedAt: Date[]
    }

export async function changeLitterStatusRecord(input: {
  ownerId: string
  litterId: string
  action: LitterStatusAction
  youngIds?: string[]
}): Promise<LitterStatusRecord> {
  const { data, error } = await createServiceSupabase().rpc('change_litter_status', {
    p_owner: input.ownerId,
    p_litter: input.litterId,
    p_action: input.action,
    p_pending_ttl: DB_RULES.p_pending_ttl,
    ...(input.youngIds === undefined ? {} : { p_young: input.youngIds }),
  })
  const row = error ? undefined : data[0]
  if (row === undefined)
    throw new Error('No se pudo cambiar el estado de la camada', { cause: error })
  const outcome = oneOf(STATUS_OUTCOMES, row.outcome, 'resultado')
  if (outcome === 'not_found') return { outcome }
  return {
    outcome,
    code: row.code,
    name: row.name,
    from: oneOf(LITTER_STATES, row.from_state, 'estado de la camada'),
    state: oneOf(LITTER_STATES, row.state, 'estado de la camada'),
    expiresAt: new Date(row.expires_at),
    publishedAt: new Date(row.published_at),
    endedMarkedAt: row.ended_marked_at.map((at) => new Date(at)),
  }
}

// El recordatorio de una camada y su enlace (research R5), con permisos de servicio: los llama la
// tarea programada, sin sesión.

export type DueLitterReminder = {
  litterId: string
  ownerId: string
  name: string
  expiresAt: Date
}

/** Marca y devuelve los recordatorios de camada debidos: cada vencimiento, una sola vez. */
export async function claimLitterReminders(limit: number): Promise<DueLitterReminder[]> {
  const { data, error } = await createServiceSupabase().rpc('claim_litter_reminders', {
    p_limit: limit,
  })
  if (error) throw new Error('No se pudieron tomar los recordatorios de camadas', { cause: error })
  return data.map((row) => ({
    litterId: row.litter_id,
    ownerId: row.owner_id,
    name: row.name,
    expiresAt: new Date(row.expires_at),
  }))
}

/** Marca y devuelve cuándo se publicó cada camada vencida que todavía no se midió. */
export async function claimLitterExpiries(limit: number): Promise<Date[]> {
  const { data, error } = await createServiceSupabase().rpc('claim_litter_expiries', {
    p_limit: limit,
  })
  if (error) throw new Error('No se pudieron tomar las camadas vencidas', { cause: error })
  return data.map((row) => new Date(row.published_at))
}

export async function createLitterRenewalLink(litterId: string, tokenHash: string): Promise<void> {
  const { error } = await createServiceSupabase().rpc('create_litter_renewal_link', {
    p_litter: litterId,
    p_token_hash: tokenHash,
  })
  if (error) throw new Error('No se pudo crear el enlace de la camada', { cause: error })
}
