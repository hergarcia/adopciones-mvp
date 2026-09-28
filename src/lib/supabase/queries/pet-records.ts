import type { PetInput } from '@/lib/schemas/pet'
import { PET_DB_RULES } from '@/lib/pets/rules'
import { createServiceSupabase } from '@/lib/supabase/service'
import { DB_RULES } from '@/lib/verification/rules'
import { dbErrorKey } from './pet-errors'

// Las escrituras de los animales: funciones de la base con permisos de servicio y la dueña como
// parámetro, que comprueban adentro el nivel 1 y la propiedad con el candado de la cuenta.
function fieldsOf(input: PetInput, ageAsOf: string) {
  return {
    name: input.name,
    species: input.species,
    sex: input.sex,
    age_value: input.age.value,
    age_unit: input.age.unit,
    age_as_of: ageAsOf,
    size: input.size,
    is_neutered: input.isNeutered,
    vaccines: input.vaccines,
    has_chip: input.hasChip,
    good_with_kids: input.goodWithKids,
    good_with_dogs: input.goodWithDogs,
    good_with_cats: input.goodWithCats,
    description: input.description,
    department: input.department,
    locality: input.locality,
    is_urgent: input.isUrgent,
  }
}

export async function publishPetRecord(input: {
  ownerId: string
  attemptId: string
  pet: PetInput
  ageAsOf: string
  photoIds: string[]
}): Promise<{ ok: true; petId: string; already: boolean } | { ok: false; error: string }> {
  const { data, error } = await createServiceSupabase().rpc('publish_pet', {
    p_owner: input.ownerId,
    p_attempt: input.attemptId,
    p_pending_ttl: DB_RULES.p_pending_ttl,
    p_staged_ttl: PET_DB_RULES.p_staged_ttl,
    p_fields: fieldsOf(input.pet, input.ageAsOf),
    p_photo_ids: input.photoIds,
  })
  const row = error ? undefined : data[0]
  if (row === undefined)
    return { ok: false, error: error ? dbErrorKey(error) : 'pets.errors.save_failed' }
  return { ok: true, petId: row.pet_id, already: row.already }
}

export async function savePetRecord(input: {
  ownerId: string
  petId: string
  pet: PetInput
  ageAsOf: string
  photoIds: string[]
}): Promise<{ ok: true; released: string[] } | { ok: false; error: string }> {
  const { data, error } = await createServiceSupabase().rpc('save_pet', {
    p_owner: input.ownerId,
    p_pet: input.petId,
    p_pending_ttl: DB_RULES.p_pending_ttl,
    p_staged_ttl: PET_DB_RULES.p_staged_ttl,
    p_fields: fieldsOf(input.pet, input.ageAsOf),
    p_photo_ids: input.photoIds,
  })
  if (error) return { ok: false, error: dbErrorKey(error) }
  return { ok: true, released: data }
}
