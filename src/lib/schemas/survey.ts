import { z } from 'zod'
import { phoneOrEmailMatch } from '@/lib/contact/contact-match'
import { isSurveyOption } from '@/lib/surveys/questions'
import { ALL_SURVEY_OPTIONS, SURVEY_MOMENTS, SURVEY_TEXT_MAX } from '@/lib/surveys/types'

const OPTION_REQUIRED = 'surveys.errors.option_required'
const NOT_FOUND = 'surveys.errors.not_found'

// Enviar la encuesta (FR-010): una de las tres opciones del momento y la respuesta libre opcional, de
// hasta 500 caracteres contados como `char_length` en la base; solo espacios es sin texto. Un
// teléfono o un correo no (FR-012); un enlace o un usuario de redes sí, porque no son de quien
// escribe. Cada error lleva su campo.
export const surveyAnswerSchema = z
  .strictObject({
    offerId: z.uuid({ message: NOT_FOUND }),
    moment: z.enum(SURVEY_MOMENTS, { message: NOT_FOUND }),
    option: z.enum(ALL_SURVEY_OPTIONS, { message: OPTION_REQUIRED }),
    body: z.string({ message: 'surveys.errors.failed' }),
  })
  .transform((value) => {
    const body = value.body.trim()
    return { ...value, body: body === '' ? null : body }
  })
  .superRefine((value, ctx) => {
    if (!isSurveyOption(value.moment, value.option)) {
      ctx.addIssue({
        // Stryker disable next-line StringLiteral: equivalente — el tipo lo exige, pero quien lee el error mira solo `message`, `path` y `params`
        code: 'custom',
        message: OPTION_REQUIRED,
        path: ['option'],
      })
    }
    if (value.body === null) return
    // oxlint-disable-next-line typescript/no-misused-spread -- puntos de código a propósito: es lo que cuenta `char_length` en la base
    if ([...value.body].length > SURVEY_TEXT_MAX) {
      ctx.addIssue({
        // Stryker disable next-line StringLiteral: equivalente, como el de arriba
        code: 'custom',
        message: 'surveys.errors.too_long',
        path: ['body'],
      })
      return
    }
    const contact = phoneOrEmailMatch(value.body)
    if (contact !== null) {
      ctx.addIssue({
        // Stryker disable next-line StringLiteral: equivalente, como el de arriba
        code: 'custom',
        message: 'surveys.errors.contact',
        path: ['body'],
        params: { fragment: contact.fragment },
      })
    }
  })

export type SurveyAnswerInput = z.input<typeof surveyAnswerSchema>
export type SurveyAnswer = z.output<typeof surveyAnswerSchema>

// «Ahora no»: la oferta y su momento, que es lo que mide `survey_dismissed`.
export const surveyDismissSchema = z.strictObject({
  offerId: z.uuid({ message: NOT_FOUND }),
  moment: z.enum(SURVEY_MOMENTS, { message: NOT_FOUND }),
})
