/** Los estados que se muestran; `skipped` (no se pidió) nunca sale de la base (research R1). */
export const FOLLOW_UP_STATUSES = ['requested', 'answered', 'closed'] as const
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number]

/** Por qué no se pidió, el primero que falla el día 30 (research R3). */
export const SKIP_REASONS = [
  'account_deleted',
  'ended',
  'declined',
  'blocked',
  'suspended',
] as const
export type SkipReason = (typeof SKIP_REASONS)[number]

/** Lo que se resolvió el día 30: pedido o no pedido, con el motivo (research R11). */
export type FollowUpEvent = { status: 'requested' } | { status: 'skipped'; reason: SkipReason }

export type FollowUpSide = 'publisher' | 'adopter'

/** Una foto de la respuesta tal como está en la base, antes de firmarla. */
export type StoredFollowUpPhoto = { id: string; width: number; height: number; thumbhash: string }

/** El seguimiento de una solicitud para una de las dos personas; de `follow_up_of`. */
export type FollowUpRow = {
  followUpId: string
  side: FollowUpSide
  status: FollowUpStatus
  requestedAt: string
  /** Nulo sin respuesta, o para quien lo dio después de un bloqueo. */
  answeredAt: string | null
  answerText: string | null
  photos: StoredFollowUpPhoto[]
  canAnswer: boolean
  /** Quien lo dio, después de un bloqueo: solo el sello (FR-034). */
  hidden: boolean
}

/** El seguimiento de la última adopción de un animal propio; de `my_pet_follow_ups`. */
export type PetFollowUp = {
  petId: string
  applicationId: string | null
  status: FollowUpStatus
  requestedAt: string
  answeredAt: string | null
  /** La adopción sigue en curso: Mis animales muestra la línea solo entonces. */
  adoptionCurrent: boolean
}

/** Las adopciones con seguimiento de una persona: las que dio y las que adoptó (research R9). */
export type FollowUpHistory = { given: number; adopted: number }

/** Lo que devuelve mandar la respuesta (research R6). */
export const FOLLOW_UP_OUTCOMES = [
  'answered',
  'already',
  'closed',
  'not_found',
  'suspended',
  'invalid',
] as const
export type FollowUpOutcome = (typeof FOLLOW_UP_OUTCOMES)[number]
