import { z } from 'zod'
import { REPORT_DETAILS_MAX } from '@/lib/moderation/rules'
import { REPORT_REASONS } from '@/lib/moderation/types'
import { isPublicId } from '@/lib/profile/public-paths'

// Reportar (FR-003): un motivo de la lista y un texto de hasta 1000 caracteres, obligatorio solo
// con «otro»; uno de puros espacios cuenta como vacío y se guarda nulo. Los caracteres se cuentan
// como los cuenta la base (`char_length`), que es la que lo guarda.
const NOT_FOUND = 'moderation.errors.not_found'

export const reportSchema = z
  .strictObject({
    // El mensaje del `string` vale también para el `refine`: un id mal formado no existe.
    publicId: z.string({ message: NOT_FOUND }).refine(isPublicId),
    reason: z.enum(REPORT_REASONS, { message: 'moderation.errors.reason_required' }),
    details: z.string().optional(),
  })
  .transform((value) => {
    const details = (value.details ?? '').trim()
    return { ...value, details: details === '' ? null : details }
  })
  .superRefine((value, ctx) => {
    if (value.details === null) {
      if (value.reason === 'other') {
        ctx.addIssue({
          // Stryker disable next-line StringLiteral: equivalente — el tipo lo exige, pero quien lee el error mira solo `message` y `path`
          code: 'custom',
          message: 'moderation.errors.details_required',
          path: ['details'],
        })
      }
      return
    }
    // oxlint-disable-next-line typescript/no-misused-spread -- puntos de código a propósito: es lo que cuenta `char_length` en la base, que guarda el texto
    if ([...value.details].length > REPORT_DETAILS_MAX) {
      ctx.addIssue({
        // Stryker disable next-line StringLiteral: equivalente, como el de arriba
        code: 'custom',
        message: 'moderation.errors.details_too_long',
        path: ['details'],
      })
    }
  })

export type ReportInput = z.input<typeof reportSchema>
export type Report = z.output<typeof reportSchema>

/** Cerrar un reporte sin medidas: el id y nada más; quién cierra sale de la sesión. */
export const closeReportSchema = z.strictObject({ reportId: z.uuid() })
