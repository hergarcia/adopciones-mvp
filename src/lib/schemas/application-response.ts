import { z } from 'zod'
import { REJECTION_REASONS, REVOCATION_REASONS } from '@/lib/applications/rejection'
import { REJECTION_NOTE_MAX_LENGTH } from '@/lib/applications/rules'
import { addContactIssue } from './field-error'

const CONTACT_PREFIX = 'inbox.errors.contact_'

// Rechazar o dejar sin efecto (FR-020, FR-024): un motivo de la lista y, solo con «otro», su línea de
// 1 a 200 caracteres sin un teléfono, un correo ni un enlace; con otro motivo la línea se descarta.
// Los caracteres se cuentan como `char_length` en la base, que es la que la guarda.
function reasonSchema<const T extends readonly [string, ...string[]]>(reasons: T) {
  return z
    .strictObject({
      id: z.uuid({ message: 'inbox.errors.not_found' }),
      reason: z.enum(reasons, { message: 'inbox.errors.missing_reason' }),
      note: z.string().optional(),
    })
    .transform((value) => ({
      ...value,
      note: value.reason === 'other' ? (value.note ?? '').trim() : null,
    }))
    .superRefine((value, ctx) => {
      if (value.note === null) return
      if (value.note === '') {
        ctx.addIssue({
          // Stryker disable next-line StringLiteral: equivalente — el tipo lo exige, pero quien lee el error mira solo `message` y `path`
          code: 'custom',
          message: 'inbox.errors.missing_note',
          path: ['note'],
        })
        return
      }
      // oxlint-disable-next-line typescript/no-misused-spread -- puntos de código a propósito: es lo que cuenta `char_length` en la base, que guarda el texto
      if ([...value.note].length > REJECTION_NOTE_MAX_LENGTH) {
        ctx.addIssue({
          // Stryker disable next-line StringLiteral: equivalente, como el de arriba
          code: 'custom',
          message: 'inbox.errors.note_too_long',
          path: ['note'],
        })
        return
      }
      addContactIssue(CONTACT_PREFIX, value.note, ctx)
    })
}

export const rejectionSchema = reasonSchema(REJECTION_REASONS)
export const revocationSchema = reasonSchema(REVOCATION_REASONS)

export type RejectionInput = z.input<typeof rejectionSchema>
export type Rejection = z.output<typeof rejectionSchema>
export type Revocation = z.output<typeof revocationSchema>
