import { z } from 'zod'
import { parsePhoneNumber } from '@/lib/verification/phone-number'
import { COMPLETE_CODE, stripCodeSeparators } from '@/lib/verification/code-input'

// Devuelve el número en E.164: lo que viaja a la base es siempre la misma forma, se haya escrito
// como se haya escrito (FR-001).
export const phoneNumberSchema = z.object({
  number: z.string().transform((value, ctx) => {
    const parsed = parsePhoneNumber(value)
    if (parsed.ok) return parsed.e164
    ctx.addIssue(`verification.errors.number_${parsed.problem}`)
    return z.NEVER
  }),
})

// Fuera de espacios y guiones, cualquier cosa que no sean los seis números se rechaza por la
// forma, sin comparar nada.
export const phoneCodeSchema = z.object({
  code: z
    .string()
    .transform(stripCodeSeparators)
    .pipe(z.string().regex(COMPLETE_CODE, 'verification.errors.code_format')),
})
