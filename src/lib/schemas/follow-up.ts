import { z } from 'zod'
import { FOLLOW_UP_MAX_PHOTOS, FOLLOW_UP_TEXT_MAX } from '@/lib/follow-ups/rules'
import { THUMBHASH_PATTERN } from '@/lib/pets/prepared-photo-files'

const INVALID = 'follow_ups.errors.invalid'

// Mandar la respuesta (FR-010): de 1 a 3 fotos ya subidas, en orden, y un texto opcional de hasta
// 500 caracteres, contados como `char_length` en la base; solo espacios es sin texto. Que las fotos
// sean de ese seguimiento y estén en espera lo decide la base con el candado (research R6).
export const followUpAnswerSchema = z
  .strictObject({
    applicationId: z.uuid({ message: 'follow_ups.errors.not_found' }),
    photoIds: z
      .array(z.uuid({ message: INVALID }))
      .min(1, { message: 'follow_ups.errors.photos_required' })
      .max(FOLLOW_UP_MAX_PHOTOS, { message: INVALID }),
    text: z.string({ message: INVALID }),
  })
  .transform((value) => {
    const text = value.text.trim()
    return { ...value, text: text === '' ? null : text }
  })
  .superRefine((value, ctx) => {
    // oxlint-disable-next-line typescript/no-misused-spread -- puntos de código a propósito: es lo que cuenta `char_length` en la base
    if (value.text !== null && [...value.text].length > FOLLOW_UP_TEXT_MAX) {
      ctx.addIssue({
        // Stryker disable next-line StringLiteral: equivalente — el tipo lo exige, pero quien lee el error mira solo `message` y `path`
        code: 'custom',
        message: 'follow_ups.errors.text_too_long',
        path: ['text'],
      })
    }
  })

export type FollowUpAnswerInput = z.input<typeof followUpAnswerSchema>

const PHOTO_INVALID = 'follow_ups.errors.photo_invalid'
// El mensaje del número vale también para sus reglas (zod 4): entero, de 1 a 32767.
const SIDE = z.coerce.number({ message: PHOTO_INVALID }).int().min(1).max(32767)

// Los campos de una foto preparada que sube sola (research R6); los archivos los mira la acción.
export const followUpPhotoSchema = z.strictObject({
  applicationId: z.uuid({ message: 'follow_ups.errors.not_found' }),
  photoId: z.uuid({ message: PHOTO_INVALID }),
  width: SIDE,
  height: SIDE,
  thumbhash: z.string().regex(THUMBHASH_PATTERN, { message: PHOTO_INVALID }),
})
