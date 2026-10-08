import { petPath } from '@/lib/pets/paths'
import {
  isActiveStatus,
  type ApplicationStatus,
  type ApplicationSummary,
  type CloseReason,
} from './types'

export type ApplicationTone = 'ink' | 'muted' | 'warning' | 'primary'

/** El sello de quien solicitó: el estado guardado, o lo que le pide algo a alguien. */
export type ApplicationStampKind =
  ApplicationStatus | 'info_requested' | 'unavailable' | 'handed_over' | 'handed_over_ended'

export type ApplicationView = {
  status: ApplicationStatus
  stamp: ApplicationStampKind
  tone: ApplicationTone
  /** El motivo de una cerrada, en una línea (FR-071); la base lo deja nulo en las demás. */
  reason: CloseReason | null
  /** Una activa cuyo animal hoy no está a la vista: «no está disponible por ahora» (FR-060). */
  unavailable: boolean
  /** A la ficha, solo mientras la base dice que se puede mostrar el animal (FR-065). */
  href: string | null
}

const TONES: Record<ApplicationStampKind, ApplicationTone> = {
  sent: 'ink',
  info_requested: 'warning',
  unavailable: 'warning',
  accepted: 'primary',
  rejected: 'muted',
  withdrawn: 'muted',
  closed: 'muted',
  handed_over: 'primary',
  handed_over_ended: 'muted',
}

// La elegida al marcar adoptado (historia #67): «Adoptaste» en yerba mientras la adopción sigue,
// «Adopción terminada» en gris cuando el animal se volvió a publicar.
function handoverStamp(adoption: ApplicationSummary['adoption']): ApplicationStampKind | null {
  if (adoption === null) return null
  return adoption === 'ended' ? 'handed_over_ended' : 'handed_over'
}

// El estado en palabras de una solicitud (research R6 de la #63, R10 de la #65): tinta mientras
// espera respuesta, mate cocido cuando le toca actuar a alguien —le preguntaron algo, o el animal no
// está a la vista por ahora—, yerba aceptada y gris cuando ya no cuenta. Se deriva al leer, así
// desaparece solo cuando el animal vuelve a la vista o la pregunta se contesta.
export function applicationView(
  application: Pick<
    ApplicationSummary,
    'status' | 'closeReason' | 'code' | 'petOnView' | 'waitingQuestion' | 'adoption'
  >,
): ApplicationView {
  const waiting = application.status === 'sent'
  const unavailable = waiting && !application.petOnView
  const handover = handoverStamp(application.adoption)
  const stamp: ApplicationStampKind =
    waiting && application.waitingQuestion
      ? 'info_requested'
      : unavailable
        ? 'unavailable'
        : (handover ?? application.status)
  return {
    status: application.status,
    stamp,
    tone: TONES[stamp],
    // «Adoptaste» ya dice por qué se cerró: la línea lo repetiría.
    reason: handover === null ? application.closeReason : null,
    unavailable,
    href: application.code === null ? null : petPath(application.code),
  }
}

/** Las activas, para «N de 3»: esperando respuesta o aceptadas (FR-016). */
export function activeCount(applications: { status: ApplicationStatus }[]): number {
  return applications.filter((application) => isActiveStatus(application.status)).length
}

/** La elegida con la adopción en curso: va en «Tus adopciones», no entre las cerradas (historia #67). */
export function isOngoingAdoption(application: Pick<ApplicationSummary, 'adoption'>): boolean {
  return application.adoption === 'pending' || application.adoption === 'accepted'
}
