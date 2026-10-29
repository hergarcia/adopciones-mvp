import { uruguayDay } from '@/lib/verification/identity-status'
import type { PublisherApplication } from './types'

/**
 * El pedido de identidad, del lado de quien publicó (research R10): se ofrece, espera desde un día,
 * o quedó solo con su día porque la solicitud dejó de esperar sin que se aprobara (FR-013).
 */
export type PublisherIdentityAskView =
  | { kind: 'offer' }
  | { kind: 'waiting'; askedOn: string }
  | { kind: 'asked_only'; askedOn: string }
  | { kind: 'none' }

type AskFacts = Pick<PublisherApplication, 'status' | 'identityAsk' | 'applicantIdentityVerified'>

/**
 * Se puede pedir solo esperando respuesta, sin pedido y sin la identidad aprobada (FR-001, R3). Sin el
 * dato de la identidad, que falta cuando el animal ya no se muestra, no se ofrece.
 */
export function canAskIdentity(application: AskFacts): boolean {
  return (
    application.status === 'sent' &&
    application.identityAsk === null &&
    application.applicantIdentityVerified === false
  )
}

export function publisherIdentityAskView(application: AskFacts): PublisherIdentityAskView {
  const ask = application.identityAsk
  if (ask === null) return canAskIdentity(application) ? { kind: 'offer' } : { kind: 'none' }
  if (ask.resolvedAt !== null) return { kind: 'none' }
  const askedOn = uruguayDay(new Date(ask.askedAt))
  return application.status === 'sent'
    ? { kind: 'waiting', askedOn }
    : { kind: 'asked_only', askedOn }
}

/** «29/10»: un día de calendario (AAAA-MM-DD) como día y mes, como lo dice la spec. */
export function shortDayLabel(day: string): string {
  return `${day.slice(8, 10)}/${day.slice(5, 7)}`
}
