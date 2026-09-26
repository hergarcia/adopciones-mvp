import { z } from 'zod'
import { IDENTITY_ORIGINS, REJECTION_REASONS } from '@/lib/verification/identity'
import { IDENTITY_PHOTO_TARGET_BYTES } from '@/lib/verification/rules'

const RIFF = [0x52, 0x49, 0x46, 0x46]
const WEBP = [0x57, 0x45, 0x42, 0x50]

// La firma de un WebP: `RIFF`, cuatro bytes de tamaño y `WEBP`. El tipo lo declara el navegador y
// se puede mentir; los bytes no.
export function hasWebpSignature(bytes: Uint8Array): boolean {
  return (
    RIFF.every((byte, i) => bytes[i] === byte) && WEBP.every((byte, i) => bytes[8 + i] === byte)
  )
}

// Una foto tal como la deja el procesado del navegador: WebP, sin metadatos, liviana. Lo que llega
// sin pasar por ahí no se guarda (FR-008a).
const processedPhoto = z.object({
  type: z.literal('image/webp'),
  bytes: z
    .instanceof(Uint8Array)
    .refine((bytes) => bytes.byteLength <= IDENTITY_PHOTO_TARGET_BYTES)
    .refine(hasWebpSignature),
})

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
