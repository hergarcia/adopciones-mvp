import type { PetFieldErrors, PetInput } from '@/lib/schemas/pet'
import { normalizePetName } from './duplicate-name'
import type { Sex } from './options'

export type SameSpeciesPet = { name: string; sex: Sex; attemptId: string }

type Facts = {
  attemptId: string
  confirmDuplicate: boolean
  validation: { ok: true; data: PetInput } | { ok: false; errors: PetFieldErrors }
  attemptPublished: () => Promise<boolean>
  isLevelOne: () => Promise<boolean>
  sameSpeciesPets: (species: string) => Promise<SameSpeciesPet[]>
}

export type PublishDecision =
  | { kind: 'already' }
  | { kind: 'needs_verification' }
  | { kind: 'invalid'; errors: PetFieldErrors }
  | { kind: 'duplicate_name'; duplicate: { name: string; sex: Sex } }
  | { kind: 'publish'; data: PetInput }

// El orden es la regla (FR-017, FR-018): un intento ya publicado gana sobre todo lo demás —un
// reintento termina como el primero aunque después haya perdido el nivel o repita el nombre—,
// después el nivel, los campos y el nombre. Pregunta en ese orden y deja de preguntar en cuanto
// decide. El animal del propio intento nunca dispara el aviso: puede aparecer entre los de la
// especie mientras la primera llamada termina de guardar.
export async function publishDecision(facts: Facts): Promise<PublishDecision> {
  if (await facts.attemptPublished()) return { kind: 'already' }
  if (!(await facts.isLevelOne())) return { kind: 'needs_verification' }
  if (!facts.validation.ok) return { kind: 'invalid', errors: facts.validation.errors }

  const data = facts.validation.data
  if (!facts.confirmDuplicate) {
    const wanted = normalizePetName(data.name)
    const same = (await facts.sameSpeciesPets(data.species)).find(
      (pet) => pet.attemptId !== facts.attemptId && normalizePetName(pet.name) === wanted,
    )
    if (same !== undefined) {
      return { kind: 'duplicate_name', duplicate: { name: same.name, sex: same.sex } }
    }
  }
  return { kind: 'publish', data }
}
