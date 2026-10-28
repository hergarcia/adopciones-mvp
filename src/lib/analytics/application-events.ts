import type { ApplyGate } from '@/lib/applications/apply-gate'
import type { RejectionReason, RevocationReason } from '@/lib/applications/rejection'
import { isQuestionId } from '@/lib/applications/questionnaire'
import { CLOSE_REASONS, type CloseReason } from '@/lib/applications/types'
import type {
  ApplicantLevel,
  ApplyAfter,
  ApplyStop,
  ContactSide,
  ResponseKind,
  TrackedEvent,
} from './events'
import {
  applicantProps,
  publisherLevelProps,
  type ApplicantMeasure,
  type MeasuredLevel,
} from './measured-levels'
import { daysSincePublished } from './pet-events'

// Los eventos de la historia #63 (research R11). Cada uno se arma eligiendo campo por campo: lo que
// llegue de más —un id, el código del animal, una respuesta— no sale, que es lo que promete FR-091.

export function applyTappedEvent(tap: {
  signedIn: boolean
  level: ApplicantLevel
  required: 1 | 2
  /** Una cría de una camada (#205, FR-050). */
  litter: boolean
  /** El de ahora de quien publicó, o de quien publicó la camada (#236); null si no se pudo leer. */
  publisherLevel: MeasuredLevel | null
}): TrackedEvent {
  return {
    name: 'apply_tapped',
    props: {
      signedIn: tap.signedIn,
      level: tap.level,
      required: tap.required,
      litter: tap.litter,
      ...publisherLevelProps(tap.publisherLevel),
    },
  }
}

const STOPS: Partial<Record<ApplyGate['kind'], ApplyStop>> = {
  needs_phone: 'phone',
  needs_identity: 'identity',
  limit: 'limit',
  not_receiving: 'not_receiving',
  unavailable: 'not_receiving',
}

/** Solo las pantallas que frenan antes del cuestionario; las demás no son un freno (FR-090). */
export function applyStoppedEvent(gate: ApplyGate['kind'], litter: boolean): TrackedEvent | null {
  const by = STOPS[gate]
  return by === undefined ? null : { name: 'apply_stopped', props: { by, litter } }
}

export function applicationStartedEvent(start: { proposed: boolean }): TrackedEvent {
  return { name: 'application_started', props: { proposed: start.proposed } }
}

// Llega de un beacon, sin sesión: solo un id del cuestionario pasa, y cualquier otra cosa es
// «ninguna», así un cuerpo armado a mano no mete texto libre en la medición.
export function applicationAbandonedEvent(body: unknown): TrackedEvent {
  const last: unknown =
    typeof body === 'object' && body !== null ? Reflect.get(body, 'lastQuestion') : undefined
  return {
    name: 'application_abandoned',
    props: { lastQuestion: isQuestionId(last) ? last : 'none' },
  }
}

export function applicationSentEvent(
  sent: {
    startedAt: number | null
    proposedUsed: boolean
    after: ApplyAfter | null
    litter: boolean
    /** Los dos de ahora, leídos juntos después de mandar (#236); null si no se pudieron leer. */
    applicantLevel: MeasuredLevel | null
    publisherLevel: MeasuredLevel | null
  },
  now: number,
): TrackedEvent {
  const seconds =
    sent.startedAt === null ? 0 : Math.max(0, Math.round((now - sent.startedAt) / 1000))
  return {
    name: 'application_sent',
    props: {
      seconds,
      proposedUsed: sent.proposedUsed,
      after: sent.after,
      litter: sent.litter,
      ...(sent.applicantLevel === null ? {} : { applicant_level: sent.applicantLevel }),
      ...publisherLevelProps(sent.publisherLevel),
    },
  }
}

/** Días de calendario desde que la mandó, como en las publicaciones; sin cuál ni de quién. */
export function applicationWithdrawnEvent(sentAt: Date, now: Date): TrackedEvent {
  return { name: 'application_withdrawn', props: { days: daysSincePublished(sentAt, now) } }
}

function isCloseReason(value: unknown): value is CloseReason {
  return CLOSE_REASONS.some((reason) => reason === value)
}

/** Uno por solicitud cerrada, con su motivo; lo que la base devuelva fuera de los motivos no sale. */
export function applicationClosedEvents(reasons: readonly unknown[]): TrackedEvent[] {
  return reasons
    .filter(isCloseReason)
    .map((reason): TrackedEvent => ({ name: 'application_closed', props: { reason } }))
}

const HOUR_MS = 3_600_000

/** Horas enteras desde que llegó; nunca negativas aunque los relojes no coincidan. */
export function hoursSince(since: Date, now: Date): number {
  return Math.max(0, Math.round((now.getTime() - since.getTime()) / HOUR_MS))
}

// Los de la historia #65 (research R11): horas y tipos, nunca quién, qué animal ni qué texto.

export function inboxOpenedEvent(): TrackedEvent {
  return { name: 'inbox_opened' }
}

export function applicationOpenedEvent(sentAt: Date, now: Date): TrackedEvent {
  return { name: 'application_opened', props: { hours: hoursSince(sentAt, now) } }
}

// Cada respuesta lleva la medida de quien solicitó, leída después de responder (historia #236), y
// la primera respuesta lleva la misma: así aceptadas, rechazadas y preguntadas se comparan por nivel.
type Response = {
  firstResponse: boolean
  sentAt: Date
  /** Null si no se pudo leer: el momento sale sin el nivel ni el sí o no. */
  applicant: ApplicantMeasure | null
}

/**
 * Aceptar registra que se aceptó, con la marca de camada de una cría (historia #206, R12), y, si fue
 * la primera respuesta, cuánto tardó (SC-007).
 */
export function applicationAcceptedEvents(
  accepted: Response & { inLitter: boolean },
  now: Date,
): TrackedEvent[] {
  const events: TrackedEvent[] = [
    {
      name: 'application_accepted',
      props: { litter: accepted.inLitter, ...applicantProps(accepted.applicant) },
    },
  ]
  if (accepted.firstResponse) events.push(firstResponseEvent('accept', accepted, now))
  return events
}

/** Rechazar registra el motivo —nunca la línea de «otro»— y, si fue la primera respuesta, cuánto tardó. */
export function applicationRejectedEvents(
  rejected: Response & { reason: RejectionReason },
  now: Date,
): TrackedEvent[] {
  const events: TrackedEvent[] = [
    {
      name: 'application_rejected',
      props: { reason: rejected.reason, ...applicantProps(rejected.applicant) },
    },
  ]
  if (rejected.firstResponse) events.push(firstResponseEvent('reject', rejected, now))
  return events
}

export function acceptanceRevokedEvent(
  reason: RevocationReason,
  applicant: ApplicantMeasure | null,
): TrackedEvent {
  return { name: 'acceptance_revoked', props: { reason, ...applicantProps(applicant) } }
}

/** Preguntar registra la pregunta —nunca su texto— y, si fue la primera respuesta, cuánto tardó. */
export function questionAskedEvents(asked: Response, now: Date): TrackedEvent[] {
  const events: TrackedEvent[] = [
    { name: 'question_asked', props: applicantProps(asked.applicant) },
  ]
  if (asked.firstResponse) events.push(firstResponseEvent('ask', asked, now))
  return events
}

/** Contestar, con las horas desde que se hizo la pregunta; nunca el texto. */
export function questionAnsweredEvent(askedAt: Date, now: Date): TrackedEvent {
  return { name: 'question_answered', props: { hours: hoursSince(askedAt, now) } }
}

export function firstResponseEvent(
  kind: ResponseKind,
  response: Pick<Response, 'sentAt' | 'applicant'>,
  now: Date,
): TrackedEvent {
  return {
    name: 'application_first_response',
    props: { hours: hoursSince(response.sentAt, now), kind, ...applicantProps(response.applicant) },
  }
}

export function whatsappTappedEvent(side: ContactSide): TrackedEvent {
  return { name: 'whatsapp_tapped', props: { side } }
}

export function inProcessFromOfferEvent(): TrackedEvent {
  return { name: 'pet_in_process_from_offer' }
}
