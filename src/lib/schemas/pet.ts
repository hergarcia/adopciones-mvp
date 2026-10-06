import { z } from 'zod'
import { CONTACT_KINDS, hasStreetNumber, type ContactKind } from '@/lib/contact/contact-match'
import { countCharacters } from '@/lib/pets/char-count'
import {
  AGE_UNITS,
  GOOD_WITH,
  REQUIRED_LEVELS,
  SEXES,
  SIZES,
  SPECIES,
  VACCINES,
  YES_NO,
  isOneOf,
} from '@/lib/pets/options'
import { AGE_RANGE, DESCRIPTION_MAX, NAME_MAX } from '@/lib/pets/rules'
import type { Age } from '@/lib/pets/age'
import { isDepartmentCode } from '@/lib/zones/departments'
import { addContactIssue, toFieldError, type FieldError } from './field-error'

export const LOCALITY_MAX = 60

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
] as const

export type PetField = (typeof PET_FIELDS)[number]
export type { FieldError }
export type PetFieldErrors = Partial<Record<PetField, FieldError>>

const CONTACT_PREFIX = 'pets.errors.contact_'

type TextRule = { field: 'name' | 'description' | 'locality'; max: number; required: boolean }

// En orden, y uno solo por campo: vacío, largo, contacto y, en la localidad, el número de puerta.
// Lo que sobra no se corta: el texto queda entero y el campo dice que sobra (spec, Edge Cases).
function checkText({ field, max, required }: TextRule) {
  return (value: string, ctx: z.RefinementCtx) => {
    if (value === '') {
      if (required) ctx.addIssue(`pets.errors.${field}_required`)
      return
    }
    if (countCharacters(value) > max) {
      ctx.addIssue(`pets.errors.${field}_too_long`)
      return
    }
    if (addContactIssue(CONTACT_PREFIX, value, ctx)) return
    if (field === 'locality' && hasStreetNumber(value)) {
      ctx.addIssue('pets.errors.locality_street_number')
    }
  }
}

function option<T extends string>(options: readonly T[], key: string) {
  return z.string().refine((value): value is T => isOneOf(options, value), key)
}

const yesNo = (key: string) => option(YES_NO, key).transform((value) => value === 'yes')

// Con `ageUnchanged` (editar sin cambiar la edad que se mostró) la edad solo tiene que ser un
// entero positivo: la de hoy puede pasar de 25 y guardarla no la rechaza (FR-010).
function ageProblem(value: string, unit: string, ageUnchanged: boolean): string | null {
  if (value === '') return 'pets.errors.age_required'
  if (!isOneOf(AGE_UNITS, unit)) return 'pets.errors.age_unit_required'
  if (!/^\d+$/u.test(value)) return 'pets.errors.age_range'
  const number = Number(value)
  if (ageUnchanged) return number >= 1 ? null : 'pets.errors.age_range'
  if (unit === 'months' && number === 12) return 'pets.errors.age_twelve_months'
  const range = AGE_RANGE[unit]
  return number < range.min || number > range.max ? 'pets.errors.age_range' : null
}

export const petSchema = z.object({
  name: z
    .string()
    .transform((value) => value.trim())
    .superRefine(checkText({ field: 'name', max: NAME_MAX, required: true })),
  species: option(SPECIES, 'pets.errors.species_required'),
  sex: option(SEXES, 'pets.errors.sex_required'),
  ageValue: z.string(),
  ageUnit: z.string(),
  size: option(SIZES, 'pets.errors.size_required'),
  isNeutered: yesNo('pets.errors.neutered_required'),
  vaccines: option(VACCINES, 'pets.errors.vaccines_required'),
  hasChip: yesNo('pets.errors.chip_required'),
  goodWithKids: option(GOOD_WITH, 'pets.errors.good_with_required'),
  goodWithDogs: option(GOOD_WITH, 'pets.errors.good_with_required'),
  goodWithCats: option(GOOD_WITH, 'pets.errors.good_with_required'),
  description: z
    .string()
    .transform((value) => value.trim())
    .superRefine(checkText({ field: 'description', max: DESCRIPTION_MAX, required: false })),
  department: z.string({ error: 'pets.errors.department_required' }).refine(isDepartmentCode),
  locality: z
    .string()
    .transform((value) => value.trim().replaceAll(/\s+/gu, ' '))
    .superRefine(checkText({ field: 'locality', max: LOCALITY_MAX, required: true })),
  isUrgent: z.boolean(),
  // Sin el campo, teléfono verificado (FR-010).
  requiredLevel: z
    .enum(REQUIRED_LEVELS, { error: 'pets.errors.required_level_invalid' })
    .optional()
    .transform((value): 1 | 2 => (value === '2' ? 2 : 1)),
})

type Parsed = z.infer<typeof petSchema>

export type PetInput = Omit<Parsed, 'ageValue' | 'ageUnit' | 'description'> & {
  age: Age
  description: string | null
}

function toInput({ ageValue, ageUnit, description, ...rest }: Parsed): PetInput {
  return {
    ...rest,
    age: { value: Number(ageValue), unit: ageUnit === 'years' ? 'years' : 'months' },
    description: description === '' ? null : description,
  }
}

// El mismo schema en el formulario y en la acción (docs/08). Un error por campo, porque cada uno
// entra debajo del suyo y el foco va al primero (FR-016).
export function validatePet(
  input: unknown,
  { ageUnchanged }: { ageUnchanged: boolean },
): { ok: true; data: PetInput } | { ok: false; errors: PetFieldErrors } {
  const result = petSchema.safeParse(input)
  // La edad va aparte del objeto: una regla sobre el objeto no corre si otro campo ya falló, y
  // FR-016 pide marcar todos a la vez.
  const age = ageProblem(
    stringOf(input, 'ageValue').trim(),
    stringOf(input, 'ageUnit'),
    ageUnchanged,
  )
  if (result.success && age === null) return { ok: true, data: toInput(result.data) }

  const issues = result.success ? [] : result.error.issues
  const errors: PetFieldErrors = {}
  for (const field of PET_FIELDS) {
    if (field === 'age') {
      if (age !== null) errors.age = { key: age }
      continue
    }
    const issue = issues.find((candidate) => candidate.path[0] === field)
    if (issue !== undefined) errors[field] = toFieldError(issue)
  }
  return { ok: false, errors }
}

function stringOf(input: unknown, key: string): string {
  if (typeof input !== 'object' || input === null) return ''
  const value: unknown = Reflect.get(input, key)
  return typeof value === 'string' ? value : ''
}

/** Qué campos se rechazaron por una vía de contacto y de qué tipo, para la medición (FR-028). */
export function contactRejections(
  errors: PetFieldErrors,
): { field: PetField; kind: ContactKind }[] {
  return PET_FIELDS.flatMap((field) => {
    const key = errors[field]?.key
    if (key === undefined || !key.startsWith(CONTACT_PREFIX)) return []
    const kind = key.slice(CONTACT_PREFIX.length)
    return isOneOf(CONTACT_KINDS, kind) ? [{ field, kind }] : []
  })
}
