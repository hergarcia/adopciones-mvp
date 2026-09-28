import { z } from 'zod'
import { CONTACT_KINDS, hasStreetNumber, type ContactKind } from '@/lib/contact/contact-match'
import { MONTEVIDEO, isDepartmentCode } from '@/lib/zones/departments'
import { addContactIssue, toFieldError, type FieldError } from './field-error'

export const NAME_MIN = 2
export const NAME_MAX = 60
export const LOCALITY_MAX = 60

// El nombre y la localidad se ven en el perfil público, así que rechazan lo mismo que la ficha de un
// animal, con la misma regla (FR-020 de la historia #12): un texto que la ficha frena por contacto,
// el perfil también, y al revés. El texto del error es del perfil.
export const CONTACT_PREFIX = 'profile.errors.contact_'
const STREET_NUMBER = 'profile.errors.locality_street_number'

// Los espacios de más no son un error de la persona: se limpian y se guarda lo que quiso escribir.
function tidy(value: string): string {
  return value.trim().replaceAll(/\s+/g, ' ')
}

const displayName = z
  .string()
  .transform(tidy)
  .pipe(z.string().min(1, 'profile.errors.name_required'))
  .pipe(z.string().min(NAME_MIN, 'profile.errors.name_too_short'))
  .pipe(z.string().max(NAME_MAX, 'profile.errors.name_too_long'))
  .superRefine((value, ctx) => {
    addContactIssue(CONTACT_PREFIX, value, ctx)
  })

// Primero el contacto y después el número de puerta: «fijo 2401 2345» es un teléfono, no una
// dirección (FR-020).
const locality = z
  .string()
  .transform(tidy)
  .pipe(z.string().min(1, 'profile.errors.locality_required'))
  .pipe(z.string().max(LOCALITY_MAX, 'profile.errors.locality_too_long'))
  .superRefine((value, ctx) => {
    if (addContactIssue(CONTACT_PREFIX, value, ctx)) return
    if (hasStreetNumber(value)) ctx.addIssue(STREET_NUMBER)
  })

const department = z
  .string()
  .refine((value) => isDepartmentCode(value), 'profile.errors.department_required')

export const profileSchema = z.object({
  displayName,
  department,
  locality,
  isRescuer: z.boolean(),
})

export type ProfileInput = z.infer<typeof profileSchema>

export type ProfileFieldErrors = Partial<Record<keyof ProfileInput, FieldError>>

// El número de puerta dice qué va en el campo con la etiqueta que el campo tiene en ese
// departamento: «barrio» en Montevideo, «localidad» en los otros (FR-020).
function withLabel(error: FieldError, input: unknown): FieldError {
  if (error.key !== STREET_NUMBER) return error
  // Un rechazo del número de puerta solo sale de un objeto: `Object` no cambia nada ahí, y le
  // ahorra al compilador preguntar algo que ya se sabe.
  const onMontevideo = Reflect.get(Object(input), 'department') === MONTEVIDEO
  return onMontevideo ? { key: `${STREET_NUMBER}_montevideo` } : error
}

// El mismo schema en el formulario y en la Server Action, que es la regla de docs/08: dos
// validaciones que puedan divergir dejarían a la persona pasando una y chocando con la otra.
// Devuelve **un error por campo** y no el primero de todos, porque cada error tiene que entrar
// debajo del campo que está mal (FR-020, docs/10 §Componentes).
//
// El resultado dice si pasó o no aparte de los errores por campo: una entrada que ni siquiera es
// un objeto no produce errores atribuibles a un campo, y devolver un mapa vacío ahí la haría
// pasar por válida.
export function validateProfile(
  input: unknown,
): { ok: true; data: ProfileInput } | { ok: false; errors: ProfileFieldErrors } {
  const result = profileSchema.safeParse(input)
  if (result.success) return { ok: true, data: result.data }

  // Campo por campo y con el primer motivo de cada uno: recorrer los problemas al revés obligaría
  // a una guarda para que el segundo no pise al primero, y esa guarda no se puede demostrar
  // necesaria mientras el schema dé un solo motivo por campo.
  const errors: ProfileFieldErrors = {}
  for (const field of FIELDS) {
    const issue = result.error.issues.find((candidate) => candidate.path[0] === field)
    if (issue !== undefined) errors[field] = withLabel(toFieldError(issue), input)
  }
  return { ok: false, errors }
}

const FIELDS = ['displayName', 'department', 'locality', 'isRescuer'] as const

/** Qué campos se rechazaron por una vía de contacto y de qué tipo, para la medición (FR-028). */
export function profileContactRejections(
  errors: ProfileFieldErrors,
): { field: 'displayName' | 'locality'; kind: ContactKind }[] {
  return (['displayName', 'locality'] as const).flatMap((field) => {
    const key = errors[field]?.key
    const kind = CONTACT_KINDS.find((candidate) => key === `${CONTACT_PREFIX}${candidate}`)
    return kind === undefined ? [] : [{ field, kind }]
  })
}
