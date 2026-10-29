import { normalizeAlertFilters } from '@/lib/alerts/filters'
import {
  CREATE_ALERT_OUTCOMES,
  type AlertFilters,
  type CreateAlertOutcome,
  type PetAlert,
} from '@/lib/alerts/types'
import { createServerSupabase } from '@/lib/supabase/server'
import { oneOf } from './pet-rows'

// La única puerta a los avisos (historia #265). Lo de la persona va con su sesión: la RLS deja leer
// y borrar solo lo propio, y crear entra por `create_pet_alert`, que toma la cuenta de la sesión.

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
