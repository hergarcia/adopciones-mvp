import type { MeasuredLevel } from '@/lib/analytics/measured-levels'
import { uruguayDay, type IdentityStatus } from '@/lib/verification/identity-status'
import type { ApplicationDetail, PublisherApplication } from './types'

/**
 * El pedido de identidad, del lado de quien publicó (research R10): se ofrece, espera desde un día,
 * se resolvió el día de la aprobación (FR-011), o quedó solo con su día porque la solicitud dejó de
 * esperar sin que se aprobara (FR-013).
 */
export type PublisherIdentityAskView =
  | { kind: 'offer' }
  | { kind: 'waiting'; askedOn: string }
  | { kind: 'verified'; askedOn: string; verifiedOn: string }
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
  const askedOn = uruguayDay(new Date(ask.askedAt))
  if (ask.resolvedAt !== null) {
    return { kind: 'verified', askedOn, verifiedOn: uruguayDay(new Date(ask.resolvedAt)) }
  }
  return application.status === 'sent'
    ? { kind: 'waiting', askedOn }
    : { kind: 'asked_only', askedOn }
}

/**
 * El pedido de identidad, del lado de quien solicitó (research R10): según su propio pedido de
 * verificación, el camino a verificar, a intentarlo de nuevo, la espera de la revisión o el día en que
 * sale del tope (FR-015); resuelto, que ya lo verificó (FR-016). Fuera de «esperando respuesta», nada
 * (FR-017).
 */
export type MyIdentityAskView =
  | { kind: 'none' }
  | { kind: 'verify'; publisherLevel: MeasuredLevel | null }
  | { kind: 'retry'; after: 'rejected' | 'expired'; publisherLevel: MeasuredLevel | null }
  | { kind: 'in_review'; publisherLevel: MeasuredLevel | null }
  | { kind: 'capped'; retryOn: string; publisherLevel: MeasuredLevel | null }
  | { kind: 'verified' }

export function myIdentityAskView(
  application: Pick<ApplicationDetail, 'status' | 'identityAsk'>,
  identity: IdentityStatus,
): MyIdentityAskView {
  const ask = application.identityAsk
  if (ask === null || application.status !== 'sent') return { kind: 'none' }
  // Aprobada sin el pedido resuelto es la aprobación que llegó mientras se abría la pantalla.
  if (ask.resolvedAt !== null || identity.kind === 'approved') return { kind: 'verified' }
  const { publisherLevel } = ask
  switch (identity.kind) {
    case 'in_review':
      return { kind: 'in_review', publisherLevel }
    case 'capped':
      return { kind: 'capped', retryOn: identity.retryOn, publisherLevel }
    case 'rejected':
    case 'expired':
      return { kind: 'retry', after: identity.kind, publisherLevel }
    default:
      return { kind: 'verify', publisherLevel }
  }
}
