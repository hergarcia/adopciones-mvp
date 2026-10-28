import { z } from 'zod'
import { phoneOrEmailMatch } from '@/lib/contact/contact-match'
import {
  ALL_EXIT_OPTIONS,
  EXIT_LEVELS,
  EXIT_TEXT_MAX,
  isExitOption,
} from '@/lib/verification/exit-question'

const OPTION = 'verification.exit.errors.option'

// Contestar «¿Qué te frena?» (research R7): una opción de ese nivel y, solo con «Otra cosa», un
// texto opcional de hasta 300 caracteres contados como `char_length` en la base; solo espacios es
// sin texto. Un teléfono o un correo no, como en la encuesta de #71. Cada error lleva su campo.
export const verificationExitAnswerSchema = z
  .strictObject({
    level: z.enum(EXIT_LEVELS, { message: OPTION }),
    option: z.enum(ALL_EXIT_OPTIONS, { message: OPTION }),
    body: z.string({ message: 'verification.exit.errors.failed' }),
  })
  .transform((value) => {
    const body = value.body.trim()
    return { ...value, body: body === '' ? null : body }
  })
  .superRefine((value, ctx) => {
    if (!isExitOption(value.level, value.option)) {
      ctx.addIssue({
        // Stryker disable next-line StringLiteral: equivalente — el tipo lo exige, pero quien lee el error mira solo `message`, `path` y `params`
        code: 'custom',
        message: OPTION,
        path: ['option'],
      })
      return
    }
    if (value.body === null) return
    if (value.option !== 'other') {
      ctx.addIssue({
        // Stryker disable next-line StringLiteral: equivalente, como el de arriba
        code: 'custom',
        message: OPTION,
        path: ['body'],
      })
      return
    }
    // oxlint-disable-next-line typescript/no-misused-spread -- puntos de código a propósito: es lo que cuenta `char_length` en la base
    if ([...value.body].length > EXIT_TEXT_MAX) {
      ctx.addIssue({
        // Stryker disable next-line StringLiteral: equivalente, como el de arriba
        code: 'custom',
        message: 'verification.exit.errors.too_long',
        path: ['body'],
      })
      return
    }
    const contact = phoneOrEmailMatch(value.body)
    if (contact !== null) {
      ctx.addIssue({
        // Stryker disable next-line StringLiteral: equivalente, como el de arriba
        code: 'custom',
        message: 'verification.exit.errors.contact',
        path: ['body'],
        params: { fragment: contact.fragment },
      })
    }
  })

export type VerificationExitAnswerInput = z.input<typeof verificationExitAnswerSchema>
export type VerificationExitAnswer = z.output<typeof verificationExitAnswerSchema>

// «Seguir sin contestar»: solo el nivel, que dice qué cookie mirar.
export const verificationExitSkipSchema = z.strictObject({
  level: z.enum(EXIT_LEVELS, { message: OPTION }),
})
