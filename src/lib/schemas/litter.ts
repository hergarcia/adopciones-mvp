import { z } from 'zod'
import { CONTACT_KINDS, type ContactKind } from '@/lib/contact/contact-match'
import {
  YOUNG_DESCRIPTION_MAX,
  YOUNG_MAX,
  YOUNG_MIN_TO_PUBLISH,
  YOUNG_MIN_TO_SAVE,
} from '@/lib/litters/rules'
import { repeatedYoungNames } from '@/lib/litters/young-names'
import { countCharacters } from '@/lib/pets/char-count'
import { SEXES, isOneOf, type Sex } from '@/lib/pets/options'
import { NAME_MAX } from '@/lib/pets/rules'
import { addContactIssue, toFieldError, type FieldError } from './field-error'
import { CONTACT_PREFIX, ageProblem, petSchema, stringOf, type PetInput } from './pet'

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
] as const
export type LitterField = (typeof LITTER_FIELDS)[number]

export const YOUNG_FIELDS = ['name', 'sex', 'description'] as const
export type YoungField = (typeof YOUNG_FIELDS)[number]
export type YoungFieldErrors = Partial<Record<YoungField, FieldError>>

export type LitterErrors = {
  fields: Partial<Record<LitterField, FieldError>>
  /** Por la `key` de cada cría. */
  young: Record<string, YoungFieldErrors>
  /** Menos crías de las que hacen falta o más de 10. */
  count: FieldError | null
}

export type YoungInput = { key: string; name: string; sex: Sex; description: string | null }

export type LitterInput = Omit<PetInput, 'sex'> & {
  deliversFrom: string | null
  young: YoungInput[]
}

type Options = {
  /** Al publicar hacen falta 2 crías; al guardar alcanza una (FR-009). */
  publishing: boolean
  /** El día de hoy en Uruguay, `AAAA-MM-DD`. */
  today: string
  /** La fecha guardada: si no cambió, una pasada no traba el guardado (FR-013). */
  storedDeliversFrom: string | null
  ageUnchanged: boolean
}

const commonSchema = petSchema.omit({ sex: true })

const trimmed = () => z.string().transform((value) => value.trim())

// Como el texto de un animal: vacío, largo y contacto, uno solo por campo y en ese orden.
function youngText(field: 'name' | 'description', max: number) {
  return (value: string, ctx: z.RefinementCtx) => {
    if (value === '') {
      if (field === 'name') ctx.addIssue('litters.errors.young_name_required')
      return
    }
    if (countCharacters(value) > max) {
      ctx.addIssue(`litters.errors.young_${field}_too_long`)
      return
    }
    addContactIssue(CONTACT_PREFIX, value, ctx)
  }
}

const youngSchema = z.object({
  key: z.string(),
  name: trimmed().superRefine(youngText('name', NAME_MAX)),
  sex: z.enum(SEXES, { error: 'pets.errors.sex_required' }),
  description: trimmed().superRefine(youngText('description', YOUNG_DESCRIPTION_MAX)),
})

// Un día del calendario escrito `AAAA-MM-DD`: el que la fecha no reescribe al leerlo (el 30 de
// febrero pasa a marzo; `+002026` pasa a `2026`).
function isCalendarDay(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

// Opcional; de hoy en adelante al publicarla o al cambiarla, y la guardada que ya pasó no traba
// (FR-013). Los días `AAAA-MM-DD` se comparan como texto.
export function deliveryProblem(
  value: string,
  { today, storedDeliversFrom }: Pick<Options, 'today' | 'storedDeliversFrom'>,
): string | null {
  if (value === '') return null
  if (!isCalendarDay(value)) return 'litters.errors.delivery_date_invalid'
  if (value === storedDeliversFrom) return null
  return value < today ? 'litters.errors.delivery_date_past' : null
}

function countProblem(count: number, publishing: boolean): FieldError | null {
  const min = publishing ? YOUNG_MIN_TO_PUBLISH : YOUNG_MIN_TO_SAVE
  if (count < min) return { key: 'litters.errors.young_too_few' }
  if (count > YOUNG_MAX) return { key: 'litters.errors.young_too_many' }
  return null
}

function youngList(input: unknown): unknown[] {
  if (typeof input !== 'object' || input === null) return []
  const value: unknown = Reflect.get(input, 'young')
  return Array.isArray(value) ? value : []
}

function youngErrorsOf(
  raw: unknown[],
  parsed: ReturnType<typeof youngSchema.safeParse>[],
): Record<string, YoungFieldErrors> {
  const repeated = new Set(repeatedYoungNames(raw.map((young) => stringOf(young, 'name'))))
  const errors: Record<string, YoungFieldErrors> = {}
  for (const [index, result] of parsed.entries()) {
    const issues = result.success ? [] : result.error.issues
    const own: YoungFieldErrors = {}
    for (const field of YOUNG_FIELDS) {
      const issue = issues.find((candidate) => candidate.path[0] === field)
      if (issue !== undefined) own[field] = toFieldError(issue)
    }
    if (own.name === undefined && repeated.has(index)) {
      own.name = { key: 'litters.errors.young_name_repeated' }
    }
    if (Object.keys(own).length > 0) errors[stringOf(raw[index], 'key')] = own
  }
  return errors
}

// El mismo schema en el formulario y en la acción (docs/08). Un error por campo y por cría, todos a
// la vez: la cría que falla se marca en esa cría y lo demás sigue cargado (US1-AS7, US1-AS8).
export function validateLitter(
  input: unknown,
  options: Options,
): { ok: true; data: LitterInput } | { ok: false; errors: LitterErrors } {
  const common = commonSchema.safeParse(input)
  const age = ageProblem(
    stringOf(input, 'ageValue').trim(),
    stringOf(input, 'ageUnit'),
    options.ageUnchanged,
  )
  const deliversFrom = stringOf(input, 'deliversFrom').trim()
  const delivery = deliveryProblem(deliversFrom, options)
  const raw = youngList(input)
  const parsed = raw.map((young) => youngSchema.safeParse(young))
  const young = youngErrorsOf(raw, parsed)
  const count = countProblem(raw.length, options.publishing)

  // Una cría puede fallar sin error que mostrar (una clave rota, algo que no es un objeto): igual
  // traba, para que ninguna se pierda por el camino.
  const allYoung = parsed.every((result) => result.success)
  const fine = allYoung && Object.keys(young).length === 0 && count === null && age === null
  if (common.success && fine && delivery === null) {
    const { ageValue, ageUnit, description, ...rest } = common.data
    return {
      ok: true,
      data: {
        ...rest,
        age: { value: Number(ageValue), unit: ageUnit === 'years' ? 'years' : 'months' },
        description: description === '' ? null : description,
        deliversFrom: deliversFrom === '' ? null : deliversFrom,
        young: parsed.flatMap((result) =>
          // Stryker disable next-line ArrayDeclaration: equivalente — `allYoung` no deja llegar acá con una cría que no pasa el schema
          result.success ? [{ ...result.data, description: result.data.description || null }] : [],
        ),
      },
    }
  }

  const issues = common.success ? [] : common.error.issues
  const fields: LitterErrors['fields'] = {}
  for (const field of LITTER_FIELDS) {
    const issue = issues.find((candidate) => candidate.path[0] === field)
    if (issue !== undefined) fields[field] = toFieldError(issue)
  }
  if (age !== null) fields.age = { key: age }
  if (delivery !== null) fields.deliversFrom = { key: delivery }
  return { ok: false, errors: { fields, young, count } }
}

type ContactField = 'name' | 'description' | 'locality'

function contactKind(error: FieldError | undefined): ContactKind | null {
  if (error === undefined || !error.key.startsWith(CONTACT_PREFIX)) return null
  const kind = error.key.slice(CONTACT_PREFIX.length)
  return isOneOf(CONTACT_KINDS, kind) ? kind : null
}

/** Los textos rechazados por una vía de contacto, de la camada y de cada cría (FR-010). */
export function litterContactRejections(
  errors: LitterErrors,
): { field: ContactField; kind: ContactKind }[] {
  const own: [ContactField, FieldError | undefined][] = [
    ['name', errors.fields.name],
    ['description', errors.fields.description],
    ['locality', errors.fields.locality],
    ...Object.values(errors.young).flatMap((young): [ContactField, FieldError | undefined][] => [
      ['name', young.name],
      ['description', young.description],
    ]),
  ]
  return own.flatMap(([field, error]) => {
    const kind = contactKind(error)
    return kind === null ? [] : [{ field, kind }]
  })
}
