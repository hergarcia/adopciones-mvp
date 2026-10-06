import type { ApplyGate } from '@/lib/applications/apply-gate'
import { isQuestionId } from '@/lib/applications/questionnaire'
import { CLOSE_REASONS, type CloseReason } from '@/lib/applications/types'
import type { ApplicantLevel, ApplyAfter, ApplyStop, TrackedEvent } from './events'
import { daysSincePublished } from './pet-events'

// Los eventos de la historia #63 (research R11). Cada uno se arma eligiendo campo por campo: lo que
// llegue de más —un id, el código del animal, una respuesta— no sale, que es lo que promete FR-091.

export function applyTappedEvent(tap: {
  signedIn: boolean
  level: ApplicantLevel
  required: 1 | 2
}): TrackedEvent {
  return {
    name: 'apply_tapped',
    props: { signedIn: tap.signedIn, level: tap.level, required: tap.required },
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
export function applyStoppedEvent(gate: ApplyGate['kind']): TrackedEvent | null {
  const by = STOPS[gate]
  return by === undefined ? null : { name: 'apply_stopped', props: { by } }
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
  sent: { startedAt: number | null; proposedUsed: boolean; after: ApplyAfter | null },
  now: number,
): TrackedEvent {
  const seconds =
    sent.startedAt === null ? 0 : Math.max(0, Math.round((now - sent.startedAt) / 1000))
  return {
    name: 'application_sent',
    props: { seconds, proposedUsed: sent.proposedUsed, after: sent.after },
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
