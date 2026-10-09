import { z } from 'zod'
import { phoneOrEmailMatch } from '@/lib/contact/contact-match'
import { FEEDBACK_TEXT_MAX } from '@/lib/feedback/types'

const FAILED = 'feedback.errors.failed'

// Enviar una opinión (FR-021, FR-024): texto obligatorio de hasta 1.000 caracteres contados como
// `char_length` en la base; solo espacios es vacío. Un teléfono o un correo no, con la regla de la
// encuesta. El intento es uno por apertura de Opinar (FR-025) y la ruta la traduce la acción.
export const feedbackSchema = z
  .strictObject({
    attemptId: z.uuid({ message: FAILED }),
    body: z.string({ message: 'feedback.errors.empty' }),
    path: z.string({ message: FAILED }),
  })
  .transform((value) => ({ ...value, body: value.body.trim() }))
  .superRefine((value, ctx) => {
    if (value.body === '') {
      ctx.addIssue({
        // Stryker disable next-line StringLiteral: equivalente — el tipo lo exige, pero quien lee el error mira solo `message`, `path` y `params`
        code: 'custom',
        message: 'feedback.errors.empty',
        path: ['body'],
      })
      return
    }
    // oxlint-disable-next-line typescript/no-misused-spread -- puntos de código a propósito: es lo que cuenta `char_length` en la base
    if ([...value.body].length > FEEDBACK_TEXT_MAX) {
      ctx.addIssue({
        // Stryker disable next-line StringLiteral: equivalente, como el de arriba
        code: 'custom',
        message: 'feedback.errors.too_long',
        path: ['body'],
      })
      return
    }
    const contact = phoneOrEmailMatch(value.body)
    if (contact !== null) {
      ctx.addIssue({
        // Stryker disable next-line StringLiteral: equivalente, como el de arriba
        code: 'custom',
        message: 'feedback.errors.contact',
        path: ['body'],
        params: { fragment: contact.fragment },
      })
    }
  })

export type FeedbackInput = z.input<typeof feedbackSchema>
