import type { PetPhotoData } from '@/lib/pets/types'
import type { Answers } from './questionnaire'

// Los estados que guarda la base (data-model.md): enviada es la única activa.
export const APPLICATION_STATUSES = ['sent', 'withdrawn', 'closed'] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const CLOSE_REASONS = [
  'adopted',
  'unpublished',
  'not_receiving',
  'you_blocked',
  'suspended',
] as const
export type CloseReason = (typeof CLOSE_REASONS)[number]

/** Si el animal recibe solicitudes hoy, sin mirar bloqueos: sí, no por ahora, o ya no. */
export const RECEIVING = ['yes', 'unavailable', 'closed'] as const
export type Receiving = (typeof RECEIVING)[number]

/** Lo que la pantalla de «Quiero adoptar» sabe de la persona y del animal (research R5). */
export type ApplyContext = {
  isOwner: boolean
  receiving: Receiving
  inProcess: boolean
  blockedByPublisher: boolean
  blockedPublisher: boolean
  myActiveId: string | null
  activeCount: number
  levelOne: boolean
  levelTwo: boolean
  requiredLevel: 1 | 2
}

export type ApplyPet = {
  code: string
  name: string
  isNeutered: boolean
  publisherName: string | null
  cover: PetPhotoData | null
}

/** Una activa, como la muestra la pantalla del límite (FR-051). */
export type ActiveApplication = {
  id: string
  sentAt: string
  /** Nulo si el animal ya no se muestra (FR-065). */
  code: string | null
  name: string
  cover: PetPhotoData | null
}

/** Una de la carpeta, como la trae la base (research R6). */
export type ApplicationSummary = {
  id: string
  status: ApplicationStatus
  closeReason: CloseReason | null
  sentAt: string
  changedAt: string
  /** Nulo si el animal se borró. */
  code: string | null
  petName: string
  /** Solo cuando corresponde mostrarla (FR-065). */
  cover: PetPhotoData | null
  petOnView: boolean
}

export type ApplicationDetail = ApplicationSummary & {
  answers: Answers
  publisherName: string | null
}
