import { MAX_QUESTIONS } from './rules'
import type { PublisherApplication } from './types'

/** «Aceptar» se ofrece, o frenado por el teléfono de una de las dos (FR-011). */
export type AcceptOffer = 'offer' | 'publisher_needs_phone' | 'applicant_needs_phone'

/** «Pedir más información»: cuántas quedan, o esperando que conteste la que ya hizo (FR-031). */
export type AskOffer = { kind: 'offer'; remaining: number } | { kind: 'pending' }

export type PublisherActions = {
  accept: AcceptOffer | null
  reject: boolean
  ask: AskOffer | null
  revoke: boolean
}

const NONE: PublisherActions = { accept: null, reject: false, ask: null, revoke: false }

// Qué ofrece una solicitud al publicador (research R10). Esperando respuesta: aceptar —sin el
// teléfono propio lleva al aviso de verificación, que va primero porque lo resuelve quien mira—,
// rechazar y preguntar mientras queden preguntas y ninguna espere. Aceptada: solo dejar sin efecto;
// lo que falta se habla por WhatsApp. Rechazada, retirada o cerrada: nada (FR-007).
export function publisherActions(
  application: Pick<
    PublisherApplication,
    'status' | 'applicantHasPhone' | 'publisherHasPhone' | 'questionsAsked' | 'questionPending'
  >,
): PublisherActions {
  if (application.status === 'accepted') return { ...NONE, revoke: true }
  if (application.status !== 'sent') return NONE
  const accept: AcceptOffer = !application.publisherHasPhone
    ? 'publisher_needs_phone'
    : application.applicantHasPhone
      ? 'offer'
      : 'applicant_needs_phone'
  const remaining = MAX_QUESTIONS - application.questionsAsked
  const ask: AskOffer | null = application.questionPending
    ? { kind: 'pending' }
    : remaining > 0
      ? { kind: 'offer', remaining }
      : null
  return { accept, reject: true, ask, revoke: false }
}
