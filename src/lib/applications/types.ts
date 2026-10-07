import type { PetPhotoData, PetState, Zone } from '@/lib/pets/types'
import type { Answers } from './questionnaire'

// Los estados que guarda la base (data-model.md de la #65): activa es esperando respuesta (`sent`) o
// aceptada; rechazada, retirada y cerrada son finales.
export const APPLICATION_STATUSES = ['sent', 'accepted', 'rejected', 'withdrawn', 'closed'] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const CLOSE_REASONS = [
  'adopted',
  'unpublished',
  'not_receiving',
  'you_blocked',
  'suspended',
] as const
export type CloseReason = (typeof CLOSE_REASONS)[number]

/** Activa: cuenta entre las 3 y bloquea una segunda al mismo animal (FR-016). */
export function isActiveStatus(status: ApplicationStatus): boolean {
  return status === 'sent' || status === 'accepted'
}

/** Por qué se cerró, del lado del publicador: retiro, bloqueo de la otra y suspensión son `gone` (FR-042). */
export const PUBLISHER_CLOSES = ['adopted', 'unpublished', 'you_blocked', 'gone'] as const
export type PublisherClose = (typeof PUBLISHER_CLOSES)[number]

/** Los correos de la bandeja de salida (research R3). */
export const NOTICE_KINDS = [
  'new_application',
  'question_answered',
  'accepted',
  'rejected',
  'question_asked',
  'closed_adopted',
  'closed_unpublished',
] as const
export type NoticeKind = (typeof NOTICE_KINDS)[number]

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
  /** Aceptada alguna vez: una cerrada por adopción sigue mostrando el contacto (FR-018). */
  wasAccepted: boolean
  /** Le preguntaron algo que todavía no contestó. */
  waitingQuestion: boolean
}

export type ApplicationDetail = ApplicationSummary & {
  answers: Answers
  publisherName: string | null
}

/** Quien mandó una solicitud, como la ve el publicador: su perfil de hoy, nunca su contacto. */
export type Applicant = {
  publicId: string
  name: string
  /** URL firmada de vida corta, o null sin foto. */
  avatar: string | null
  zone: Zone
  level: 0 | 1 | 2 | 3
}

/** Un animal de la bandeja (FR-002). */
export type InboxPet = {
  petId: string
  code: string
  name: string
  cover: PetPhotoData | null
  waiting: number
  fresh: number
  lastSentAt: string
}

/** Una solicitud en la carpeta de un animal (FR-003, FR-004). */
export type PetApplicationRow = {
  id: string
  status: ApplicationStatus
  publisherClose: PublisherClose | null
  sentAt: string
  changedAt: string
  isNew: boolean
  waitingQuestion: boolean
  applicant: Applicant | null
  /** Vivienda, patio o balcón y horas solo: para comparar de un vistazo. */
  keyAnswers: Answers
}

/** Una solicitud para el publicador; sin quien la mandó si el animal ya no está publicado (FR-043). */
export type PublisherApplication = {
  id: string
  status: ApplicationStatus
  publisherClose: PublisherClose | null
  sentAt: string
  changedAt: string
  pet: { id: string; code: string; state: PetState } | null
  petName: string
  petSex: string | null
  cover: PetPhotoData | null
  applicant: Applicant | null
  answers: Answers | null
  openedAt: string | null
  acceptedAt: string | null
  applicantHasPhone: boolean
  publisherHasPhone: boolean
  questionsAsked: number
  questionPending: boolean
}

/** El contacto de la otra persona (FR-012, FR-013): `phone` nulo si hoy no tiene uno verificado. */
export type Contact = {
  name: string
  phone: string | null
  /** Quién mira: el mensaje de WhatsApp y la medición dependen de eso. */
  side: 'publisher' | 'applicant'
  viewerName: string
  petName: string
}
