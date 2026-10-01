import { z } from 'zod'
import { TAKEDOWN_NOTE_MAX } from '@/lib/pets/rules'
import { TAKEDOWN_REASONS } from '@/lib/pets/types'

// `knownSince` es la espera tal como la devolvió la base, con sus microsegundos: la base la compara
// exacta para saber si otra persona ya la resolvió (research R8).
const target = { petId: z.uuid(), knownSince: z.iso.datetime({ offset: true }) }

// Marcar revisada, o dar de baja con un motivo de la lista; «otro» lleva su texto de 1 a 300
// caracteres, que el publicador lee tal cual (FR-025). Con otro motivo, el texto se descarta. Los
// caracteres se cuentan como los cuenta la base (`char_length`), que es la que lo guarda.
export const petReviewResolutionSchema = z
  .discriminatedUnion('outcome', [
    z.strictObject({ ...target, outcome: z.literal('reviewed') }),
    z.strictObject({
      ...target,
      outcome: z.literal('taken_down'),
      reason: z.enum(TAKEDOWN_REASONS),
      note: z.string().optional(),
    }),
  ])
  .transform((value) =>
    value.outcome === 'reviewed'
      ? value
      : { ...value, note: value.reason === 'other' ? (value.note ?? '').trim() : null },
  )
  .superRefine((value, ctx) => {
    if (value.outcome === 'reviewed' || value.note === null) return
    // oxlint-disable-next-line typescript/no-misused-spread -- puntos de código a propósito: es lo que cuenta `char_length` en la base, que guarda el texto
    const length = [...value.note].length
    if (length === 0) {
      ctx.addIssue({
        // Stryker disable next-line StringLiteral: equivalente — el tipo lo exige, pero quien lee el error (la acción y la hoja) mira solo `message` y `path`, que zod guarda con cualquier código
        code: 'custom',
        message: 'pet_review.errors.note_required',
        path: ['note'],
      })
    } else if (length > TAKEDOWN_NOTE_MAX) {
      ctx.addIssue({
        // Stryker disable next-line StringLiteral: equivalente, como el de arriba
        code: 'custom',
        message: 'pet_review.errors.note_too_long',
        path: ['note'],
      })
    }
  })

export type PetReviewResolution = z.infer<typeof petReviewResolutionSchema>
