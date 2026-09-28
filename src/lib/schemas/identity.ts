import { z } from 'zod'
import { PROCESSED_PHOTO_TYPES, processedPhotoType } from '@/lib/profile/identity-photo'
import { IDENTITY_ORIGINS, REJECTION_REASONS } from '@/lib/verification/identity'
import { IDENTITY_PHOTO_TARGET_BYTES } from '@/lib/verification/rules'

// Una foto tal como la deja el procesado del navegador: sin metadatos, liviana, y con los bytes del
// formato que dice ser. Lo que llega sin pasar por ahí no se guarda (FR-008a).
const processedPhoto = z
  .object({
    type: z.enum(PROCESSED_PHOTO_TYPES),
    bytes: z
      .instanceof(Uint8Array)
      .refine((bytes) => bytes.byteLength <= IDENTITY_PHOTO_TARGET_BYTES),
  })
  .refine((photo) => processedPhotoType(photo.bytes) === photo.type)

// El envío entero: el consentimiento viaja con el pedido (FR-003), y exactamente dos fotos (FR-005).
// Cualquier falla es la misma para la persona —las fotos no sirven—, así que no lleva mensajes.
export const identitySubmissionSchema = z.object({
  consent: z.literal('yes'),
  origin: z.enum(IDENTITY_ORIGINS),
  front: processedPhoto,
  selfie: processedPhoto,
})

export type IdentitySubmission = z.infer<typeof identitySubmissionSchema>

// Aprobar no lleva motivo; rechazar lleva exactamente uno de los cuatro, sin texto libre (FR-016).
export const identityResolutionSchema = z.discriminatedUnion('outcome', [
  z.strictObject({ requestId: z.uuid(), outcome: z.literal('approve') }),
  z.strictObject({
    requestId: z.uuid(),
    outcome: z.literal('reject'),
    reason: z.enum(REJECTION_REASONS),
  }),
])

export type IdentityResolution = z.infer<typeof identityResolutionSchema>
