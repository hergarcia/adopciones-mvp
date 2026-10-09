import { z } from 'zod'
import { SUSPENSION_REASON_MAX } from '@/lib/moderation/rules'
import { isPublicId } from '@/lib/profile/public-paths'

// Suspender (FR-018): siempre con un motivo escrito de hasta 1000 caracteres; uno de puros espacios
// cuenta como vacío. Se guarda sin los bordes, y se cuenta como cuenta la base (`char_length`).
// `reportId` es el reporte desde el que se suspende, si se suspende desde la lista; `origin` dice que
// se suspende desde la ficha de la persona (historia #73), solo para el evento.
export const suspensionSchema = z
  .strictObject({
    publicId: z.string({ message: 'moderation.errors.gone' }).refine(isPublicId),
    reason: z.string({ message: 'moderation.errors.reason_required' }),
    reportId: z.uuid({ message: 'moderation.errors.gone' }).optional(),
    origin: z.literal('record').optional(),
  })
  .transform((value) => ({ ...value, reason: value.reason.trim() }))
  .superRefine((value, ctx) => {
    if (value.reason === '') {
      ctx.addIssue({
        // Stryker disable next-line StringLiteral: equivalente — el tipo lo exige, pero quien lee el error mira solo `message` y `path`
        code: 'custom',
        message: 'moderation.errors.reason_required',
        path: ['reason'],
      })
      return
    }
    // oxlint-disable-next-line typescript/no-misused-spread -- puntos de código a propósito: es lo que cuenta `char_length` en la base
    if ([...value.reason].length > SUSPENSION_REASON_MAX) {
      ctx.addIssue({
        // Stryker disable next-line StringLiteral: equivalente, como el de arriba
        code: 'custom',
        message: 'moderation.errors.reason_too_long',
        path: ['reason'],
      })
    }
  })

export type SuspensionInput = z.input<typeof suspensionSchema>
export type Suspension = z.output<typeof suspensionSchema>

/** Reactivar: la suspensión y nada más; quién reactiva sale de la sesión. */
export const reactivateSchema = z.strictObject({ suspensionId: z.uuid() })
