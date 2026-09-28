// Las opciones de la ficha, con las claves que guarda la base (docs/06: enums en inglés).
export const SPECIES = ['dog', 'cat'] as const
export const SEXES = ['male', 'female'] as const
export const AGE_UNITS = ['months', 'years'] as const
export const SIZES = ['small', 'medium', 'large'] as const
export const VACCINES = ['up_to_date', 'incomplete', 'none'] as const
export const YES_NO = ['yes', 'no'] as const
export const GOOD_WITH = ['yes', 'no', 'unknown'] as const

export type Species = (typeof SPECIES)[number]
export type Sex = (typeof SEXES)[number]
export type Size = (typeof SIZES)[number]
export type Vaccines = (typeof VACCINES)[number]
export type GoodWith = (typeof GOOD_WITH)[number]

export function isOneOf<T extends string>(options: readonly T[], value: string): value is T {
  return (options as readonly string[]).includes(value)
}
