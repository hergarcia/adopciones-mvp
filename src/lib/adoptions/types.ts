import type { Sex } from '@/lib/pets/options'
import type { PetState } from '@/lib/pets/types'
import type { BadgeLevel } from '@/lib/verification/badge-parts'

/** A quién se entregó: a una persona del sitio o por fuera (research R1). */
export const ADOPTION_KINDS = ['site', 'outside'] as const
export type AdoptionKind = (typeof ADOPTION_KINDS)[number]

/** La adopción vigente de un animal propio, como la lee Mis animales (FR-040). */
export type PetAdoptionSummary = {
  petId: string
  kind: AdoptionKind
  /** Nulo si es por fuera o si la persona borró su cuenta. */
  adopterName: string | null
  declined: boolean
  adopterAcceptedAt: string | null
  markedAt: string
  /** Volver a publicar termina una adopción con una persona: pide confirmación (R6). */
  endsPerson: boolean
}

/** Una persona con la solicitud aceptada, para elegir a quién se lo dio (FR-001). */
export type HandoverCandidate = {
  applicationId: string
  publicId: string
  name: string
  /** La ruta de la foto de su perfil público, o null sin foto. */
  avatar: string | null
  level: 0 | BadgeLevel
  acceptedAt: string | null
}

/** El animal de «¿A quién se lo diste?». */
export type HandoverPet = {
  petId: string
  name: string
  sex: Sex
  code: string
  state: PetState
  isNeutered: boolean
  publisherName: string
}

/** Lo que devuelve marcar adoptado (research R3). */
export const HANDOVER_OUTCOMES = [
  'done',
  'already',
  'changed',
  'gone',
  'you_blocked',
  'revoked',
  'not_found',
] as const
export type HandoverOutcome = (typeof HANDOVER_OUTCOMES)[number]

/** Lo que devuelve aceptar el compromiso (research R5). */
export const COMMITMENT_OUTCOMES = ['done', 'already', 'suspended', 'closed', 'not_found'] as const
export type CommitmentOutcome = (typeof COMMITMENT_OUTCOMES)[number]

/** La adopción de una solicitud, para las dos personas (FR-043); de `adoption_of`. */
export type AdoptionRow = {
  side: 'publisher' | 'adopter'
  petName: string
  petSex: Sex
  includesNeuter: boolean
  /** Los nombres de hoy (FR-011); nulo si esa persona borró su cuenta. */
  publisherName: string | null
  adopterName: string | null
  markedAt: string
  adopterAcceptedAt: string | null
  declinedAt: string | null
  endedAt: string | null
  contactCut: boolean
  adopterSuspended: boolean
}
