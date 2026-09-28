// Los nombres del dominio de la verificación de identidad (historia #11), con las mismas claves en
// inglés que los `check` de la base (docs/06).

/** Desde dónde llegó la persona al pedido (FR-035). La historia de la publicación suma el suyo. */
export const IDENTITY_ORIGINS = ['profile'] as const
export type IdentityOrigin = (typeof IDENTITY_ORIGINS)[number]

/** Los cuatro motivos de rechazo, sin texto libre (FR-016). */
export const REJECTION_REASONS = [
  'unreadable',
  'mismatch',
  'expired_document',
  'suspected_fraud',
] as const
export type RejectionReason = (typeof REJECTION_REASONS)[number]

export const IDENTITY_PHOTO_KINDS = ['front', 'selfie'] as const
export type IdentityPhotoKind = (typeof IDENTITY_PHOTO_KINDS)[number]

export function isIdentityOrigin(value: string): value is IdentityOrigin {
  return (IDENTITY_ORIGINS as readonly string[]).includes(value)
}

export function isRejectionReason(value: string): value is RejectionReason {
  return (REJECTION_REASONS as readonly string[]).includes(value)
}

export function isIdentityPhotoKind(value: string): value is IdentityPhotoKind {
  return (IDENTITY_PHOTO_KINDS as readonly string[]).includes(value)
}
