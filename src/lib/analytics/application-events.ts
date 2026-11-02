import type { ApplyGate } from '@/lib/applications/apply-gate'
import type { RejectionReason, RevocationReason } from '@/lib/applications/rejection'
import { isQuestionId } from '@/lib/applications/questionnaire'
import {
  CLOSE_REASONS,
  HELD_LAPSE_REASONS,
  type CloseReason,
  type HeldLapseReason,
} from '@/lib/applications/types'
import type {
  ApplicantLevel,
  ApplyAfter,
  ApplyStop,
  ContactSide,
  HeldLapseMetric,
  ResponseKind,
  TrackedEvent,
} from './events'
import {
  applicantProps,
  measuredLevelOf,
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

const STOPS: Partial<Record<ApplyGate['kind'], Exclude<ApplyStop, 'identity'>>> = {
  needs_phone: 'phone',
  limit: 'limit',
  not_receiving: 'not_receiving',
  unavailable: 'not_receiving',
}

export type ApplyStoppedEvent = Extract<TrackedEvent, { name: 'apply_stopped' }>

/**
 * Solo las pantallas que frenan antes del cuestionario; las demás no son un freno (FR-090). El de
 * identidad dice si se le ofreció dejarla escrita (historia #289, FR-037).
 */
export function applyStoppedEvent(gate: ApplyGate, litter: boolean): ApplyStoppedEvent | null {
  if (gate.kind === 'needs_identity') {
    return {
      name: 'apply_stopped',
      props: { by: 'identity', litter, hold_offered: gate.canHold },
    }
  }
  const by = STOPS[gate.kind]
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

function applicantLevelProps(level: MeasuredLevel | null): { applicant_level?: MeasuredLevel } {
  return level === null ? {} : { applicant_level: level }
}

/** Segundos redondeados desde la primera respuesta; cero sin comienzo o con el reloj para atrás. */
function secondsSince(startedAt: number | null, now: number): number {
  return startedAt === null ? 0 : Math.max(0, Math.round((now - startedAt) / 1000))
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
  return {
    name: 'application_sent',
    props: {
      seconds: secondsSince(sent.startedAt, now),
      proposedUsed: sent.proposedUsed,
      after: sent.after,
      litter: sent.litter,
      ...applicantLevelProps(sent.applicantLevel),
      ...publisherLevelProps(sent.publisherLevel),
      held: false,
    },
  }
}

/** Quedó escrita esperando la identidad (historia #289, FR-038), medida como una mandada. */
export function applicationHeldEvent(
  held: { startedAt: number | null; proposedUsed: boolean; litter: boolean },
  now: number,
): TrackedEvent {
  return {
    name: 'application_held',
    props: {
      seconds: secondsSince(held.startedAt, now),
      proposedUsed: held.proposedUsed,
      litter: held.litter,
    },
  }
}

const LAPSE_METRICS: Record<HeldLapseReason, HeldLapseMetric> = {
  expired: 'expired',
  withdrawn: 'withdrawn',
  capped: 'capped',
  suspended: 'suspended',
  adopted: 'not_receiving',
  unpublished: 'not_receiving',
  not_receiving: 'not_receiving',
  you_blocked: 'not_receiving',
}

function isHeldLapseReason(value: unknown): value is HeldLapseReason {
  return HELD_LAPSE_REASONS.some((reason) => reason === value)
}

/** Un momento de `claim_held_application_moments`, como lo devuelve la base. */
export type HeldMomentRow = {
  kind: string
  reason: string | null
  applicant_level: number | null
  publisher_level: number | null
  litter: boolean
}

/**
 * Lo que la base anotó al salir o no salir una que esperaba (historia #289, research R10). La que
 * sale cuenta además como mandada después de la identidad, marcada `held` (FR-039), con los niveles
 * de ese instante. Lo que la base devuelva fuera de los tipos y motivos no sale.
 */
export function heldMomentEvents(moment: HeldMomentRow): TrackedEvent[] {
  if (moment.kind === 'released') {
    return [
      { name: 'held_application_released', props: { litter: moment.litter } },
      {
        name: 'application_sent',
        props: {
          seconds: 0,
          proposedUsed: false,
          after: 'identity',
          litter: moment.litter,
          ...applicantLevelProps(measuredLevelOf(moment.applicant_level)),
          ...publisherLevelProps(measuredLevelOf(moment.publisher_level)),
          held: true,
        },
      },
    ]
  }
  if (moment.kind === 'lapsed' && isHeldLapseReason(moment.reason)) {
    return [{ name: 'held_application_lapsed', props: { reason: LAPSE_METRICS[moment.reason] } }]
  }
  return []
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
