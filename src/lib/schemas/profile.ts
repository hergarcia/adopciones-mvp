import { z } from 'zod'
import { isDepartmentCode } from '@/lib/zones/departments'

export const NAME_MIN = 2
export const NAME_MAX = 60
export const LOCALITY_MAX = 60

// Qué cuenta como vía de contacto, definido de forma estrecha y literal para que el rechazo se
// pueda explicar (FR-020b). Son los dos campos que la historia #12 vuelve públicos, y el contacto
// fuera de una solicitud aceptada es lo que este producto no hace.
//
// Estrecha a propósito: «Villa 25 de Agosto» y «Ruta 8 km 25» tienen que pasar, así que hacen
// falta nueve dígitos seguidos —un teléfono uruguayo tiene nueve— y no cualquier número.
const AT_SIGN = /\p{L}@\p{L}/u
const WEB_ADDRESS = /(https?:\/\/|www\.)|\.(com|uy|net|org)\b/i
const PHONE = /(?:\d[\s.-]?){9,}/

export function contactKind(value: string): 'email' | 'web' | 'phone' | null {
  if (AT_SIGN.test(value)) return 'email'
  if (WEB_ADDRESS.test(value)) return 'web'
  if (PHONE.test(value)) return 'phone'
  return null
}

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
  .refine((value) => contactKind(value) === null, 'profile.errors.name_has_contact')

const locality = z
  .string()
  .transform(tidy)
  .pipe(z.string().min(1, 'profile.errors.locality_required'))
  .pipe(z.string().max(LOCALITY_MAX, 'profile.errors.locality_too_long'))
  .refine((value) => contactKind(value) === null, 'profile.errors.locality_has_contact')

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
