/**
 * Los campos de una camada y de cada cría, en el orden en que se marcan sus errores. Sin zod: el
 * formulario los usa al abrir y las reglas llegan después (historia #338).
 */
export const LITTER_FIELDS = [
  'name',
  'species',
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
  'deliversFrom',
  'ownQuestion',
] as const
export type LitterField = (typeof LITTER_FIELDS)[number]

export const YOUNG_FIELDS = ['name', 'sex', 'description'] as const
export type YoungField = (typeof YOUNG_FIELDS)[number]
