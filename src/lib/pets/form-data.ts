import { formText } from '@/lib/forms/form-data'
import type { Pet, PetFormValues } from './types'

const TEXT_FIELDS = [
  'name',
  'species',
  'sex',
  'ageValue',
  'ageUnit',
  'size',
  'isNeutered',
  'vaccines',
  'hasChip',
  'goodWithKids',
  'goodWithDogs',
  'goodWithCats',
  'description',
  'department',
  'locality',
  'requiredLevel',
] as const

/** El formulario del animal como viaja en la acción: los mismos nombres que `PetFormValues`. */
export function petFormData(values: PetFormValues, extra: Record<string, string> = {}): FormData {
  const form = new FormData()
  for (const key of TEXT_FIELDS) form.set(key, values[key])
  form.set('isUrgent', String(values.isUrgent))
  for (const [key, value] of Object.entries(extra)) form.set(key, value)
  return form
}

export function petFormValues(form: FormData): PetFormValues {
  const values = Object.fromEntries(TEXT_FIELDS.map((key) => [key, formText(form, key)]))
  return {
    name: values.name,
    species: values.species,
    sex: values.sex,
    ageValue: values.ageValue,
    ageUnit: values.ageUnit,
    size: values.size,
    isNeutered: values.isNeutered,
    vaccines: values.vaccines,
    hasChip: values.hasChip,
    goodWithKids: values.goodWithKids,
    goodWithDogs: values.goodWithDogs,
    goodWithCats: values.goodWithCats,
    description: values.description,
    department: values.department,
    locality: values.locality,
    isUrgent: formText(form, 'isUrgent') === 'true',
    requiredLevel: values.requiredLevel,
  }
}

/** Los ids de las fotos en orden, como los manda el formulario. Cualquier otra cosa es ninguno. */
export function photoIdsFrom(form: FormData): string[] {
  try {
    const parsed: unknown = JSON.parse(formText(form, 'photoIds'))
    return Array.isArray(parsed) && parsed.every((id) => typeof id === 'string') ? parsed : []
  } catch {
    return []
  }
}

/** Lo publicado, en el formulario: la edad de hoy y los sí o no como claves (FR-010, FR-019). */
export function petFormValuesOf(pet: Pet): PetFormValues {
  const yesNo = (value: boolean) => (value ? 'yes' : 'no')
  return {
    name: pet.name,
    species: pet.species,
    sex: pet.sex,
    ageValue: String(pet.age.value),
    ageUnit: pet.age.unit,
    size: pet.size,
    isNeutered: yesNo(pet.isNeutered),
    vaccines: pet.vaccines,
    hasChip: yesNo(pet.hasChip),
    goodWithKids: pet.goodWithKids,
    goodWithDogs: pet.goodWithDogs,
    goodWithCats: pet.goodWithCats,
    description: pet.description ?? '',
    department: pet.zone.department,
    locality: pet.zone.locality,
    isUrgent: pet.isUrgent,
    requiredLevel: String(pet.requiredLevel),
  }
}

/** Lo que viaja además de los campos al guardar una edición: el animal y la edad al abrir. */
export function editExtras(editing: {
  petId: string
  ageBase: { value: number; unit: string; asOf: string }
  ageShown: { value: number; unit: string }
}): Record<string, string> {
  return {
    petId: editing.petId,
    ageBaseValue: String(editing.ageBase.value),
    ageBaseUnit: editing.ageBase.unit,
    ageBaseAsOf: editing.ageBase.asOf,
    ageShownValue: String(editing.ageShown.value),
    ageShownUnit: editing.ageShown.unit,
  }
}
