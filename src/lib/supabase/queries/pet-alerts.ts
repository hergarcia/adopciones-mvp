import { normalizeAlertFilters } from '@/lib/alerts/filters'
import {
  CREATE_ALERT_OUTCOMES,
  type AlertFilters,
  type AlertMailClaim,
  type AlertMatch,
  type CreateAlertOutcome,
  type PetAlert,
} from '@/lib/alerts/types'
import { ageOn, uruguayDay } from '@/lib/pets/age'
import { SEXES, SPECIES } from '@/lib/pets/options'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import type { Database } from '@/lib/supabase/types'
import { oneOf, storedAgeOf, zoneOf } from './pet-rows'

// La única puerta a los avisos (historia #265). Lo de la persona va con su sesión: la RLS deja leer
// y borrar solo lo propio, y crear entra por `create_pet_alert`, que toma la cuenta de la sesión. La
// corrida de las 8 y los enlaces de «Dejar de recibir» van con el servicio, por funciones que nadie
// con sesión puede llamar.

type AlertColumns = {
  species: string[]
  sexes: string[]
  sizes: string[]
  age_bands: string[]
  departments: string[]
  neutered_only: boolean
}

export function alertFiltersOf(row: AlertColumns): AlertFilters {
  return normalizeAlertFilters({
    species: row.species,
    sex: row.sexes,
    size: row.sizes,
    age: row.age_bands,
    department: row.departments,
    neutered: row.neutered_only ? ['yes'] : [],
  })
}

export async function createPetAlertRecord(filters: AlertFilters): Promise<CreateAlertOutcome> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('create_pet_alert', {
    p_species: filters.species,
    p_sexes: filters.sex,
    p_sizes: filters.size,
    p_age_bands: filters.age,
    p_departments: filters.department,
    p_neutered_only: filters.neutered.length > 0,
  })
  if (error) throw new Error('No se pudo crear el aviso', { cause: error })
  return oneOf(CREATE_ALERT_OUTCOMES, data, 'resultado del aviso')
}

/** Los avisos de quien tiene la sesión, del más viejo al más nuevo. */
export async function listMyPetAlerts(): Promise<PetAlert[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('pet_alerts')
    .select('id, species, sexes, sizes, age_bands, departments, neutered_only, created_at')
    .order('created_at')
    .order('id')
  if (error) throw new Error('No se pudieron traer los avisos', { cause: error })
  return data.map((row) => ({
    id: row.id,
    filters: alertFiltersOf(row),
    createdAt: row.created_at,
  }))
}

/** `true` si borró el aviso; `false` si ya no estaba (o no era de quien tiene la sesión). */
export async function deletePetAlertRecord(alertId: string): Promise<boolean> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.from('pet_alerts').delete().eq('id', alertId).select('id')
  if (error) throw new Error('No se pudo borrar el aviso', { cause: error })
  return data.length > 0
}

type MailRow = Database['public']['Functions']['claim_pet_alert_mail']['Returns'][number]

function matchOf(row: MailRow, today: string): AlertMatch {
  const common = {
    code: row.code,
    name: row.name,
    species: oneOf(SPECIES, row.item_species, 'especie'),
    age: ageOn(storedAgeOf(row), today),
    zone: zoneOf(row),
    coverId: row.cover_id,
    firstListedAt: row.first_listed_at,
  }
  return row.kind === 'litter'
    ? { ...common, kind: 'litter', youngCount: row.young_count }
    : { ...common, kind: 'pet', sex: oneOf(SEXES, row.sex, 'sexo') }
}

/**
 * La corrida de las 8 (research R2, R3): reclama el día de cada persona con avisos y devuelve, de las
 * que tienen algo nuevo, sus avisos en el orden en que los creó con todo lo que les coincide. A las
 * demás la base ya les cerró el período.
 */
export async function claimPetAlertMail(): Promise<AlertMailClaim[]> {
  const { data, error } = await createServiceSupabase().rpc('claim_pet_alert_mail')
  if (error) throw new Error('No se pudo reclamar el correo de avisos', { cause: error })
  const claims = new Map<string, AlertMailClaim>()
  for (const row of data) {
    const claim = claims.get(row.user_id) ?? { userId: row.user_id, runAt: row.run_at, alerts: [] }
    claims.set(row.user_id, claim)
    let alert = claim.alerts.find((one) => one.alertId === row.alert_id)
    if (alert === undefined) {
      alert = { alertId: row.alert_id, filters: alertFiltersOf(row), matches: [] }
      claim.alerts.push(alert)
    }
    alert.matches.push(matchOf(row, uruguayDay(new Date(row.run_at))))
  }
  return [...claims.values()]
}

/** El correo salió: lo que miró la corrida no vuelve en otro. */
export async function markPetAlertsMailed(userId: string, runAt: string): Promise<void> {
  const { error } = await createServiceSupabase().rpc('mark_pet_alerts_mailed', {
    p_user: userId,
    p_run_at: runAt,
  })
  if (error) throw new Error('No se pudo marcar el correo de avisos', { cause: error })
}

/** Guarda el hash del «Dejar de recibir» de un correo; el token en claro va solo en el correo. */
export async function createUnsubscribeLink(userId: string, tokenHash: string): Promise<void> {
  const { error } = await createServiceSupabase().rpc('create_pet_alert_unsubscribe_link', {
    p_user: userId,
    p_token_hash: tokenHash,
  })
  if (error) throw new Error('No se pudo guardar el enlace para dejar de recibir', { cause: error })
}
