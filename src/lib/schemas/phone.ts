import { z } from 'zod'
import { parsePhoneNumber } from '@/lib/verification/phone-number'
import { CODE_LENGTH } from '@/lib/verification/rules'

// El mismo schema en el formulario y en la acción. Devuelve el número en E.164: lo que viaja a la
// base es siempre la misma forma, se haya escrito como se haya escrito (FR-001).
export const phoneNumberSchema = z.object({
  number: z.string().transform((value, ctx) => {
    const parsed = parsePhoneNumber(value)
    if (parsed.ok) return parsed.e164
    ctx.addIssue(`verification.errors.number_${parsed.problem}`)
    return z.NEVER
  }),
})

const CODE = new RegExp(`^\\d{${CODE_LENGTH}}$`)

// Espacios y guiones se ignoran: así llega un código pegado de un mensaje o sugerido por el
// teléfono (FR-007b). Cualquier otra cosa se rechaza por la forma, sin comparar nada.
export const phoneCodeSchema = z.object({
  code: z
    .string()
    .transform((value) => value.replaceAll(/[\s-]/g, ''))
    .pipe(z.string().regex(CODE, 'verification.errors.code_format')),
})
