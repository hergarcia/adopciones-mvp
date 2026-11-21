/** Los campos del formulario de un animal, en el orden en que se marcan sus errores. */
export const PET_FIELDS = [
  'name',
  'species',
  'sex',
  'age',
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
  'ownQuestion',
] as const

export type PetField = (typeof PET_FIELDS)[number]
