import type { IdentityOrigin, RejectionReason } from '@/lib/verification/identity'

// Los siete momentos de FR-032 de la historia #9, los siete de FR-024 de la #10, los cuatro de
// FR-014 de la #25 y los nueve de FR-035 de la #11. Cada uno tiene un disparador exacto, y ningún par se dispara siempre en el
// mismo instante: dos nombres para un mismo hecho no miden nada.
export const EVENTS = [
  'account_creation_started',
  'account_creation_finished',
  'signed_in_with_link',
  'signed_in_with_google',
  'profile_edited',
  'signed_out',
  'account_deleted',
  'phone_code_requested',
  'phone_code_cap_reached',
  'phone_site_cap_reached',
  'phone_verified',
  'phone_changed',
  'phone_code_failed',
  'phone_number_in_use',
  // Se toca «Es mío y no puedo entrar a esa cuenta», se abra la confirmación o no.
  'phone_claim_chosen',
  // La cuenta queda con el número, lo tuviera otra o estuviera libre.
  'phone_claimed',
  // Otra cuenta perdió el número; no cuando estaba libre.
  'phone_number_lost',
  // Una cuenta con el aviso de número perdido queda verificada, con ese número u otro.
  'phone_reverified_after_loss',
  // «Mi perfil» se dibuja con la oferta de nivel 2.
  'identity_offer_viewed',
  // Se dibuja la vista de pedir: nivel 1, sin pedido abierto y sin el tope.
  'identity_request_started',
  // Se toca «Acepto y elijo las fotos».
  'identity_consent_accepted',
  // El pedido queda en revisión con sus dos imágenes.
  'identity_request_sent',
  'identity_request_withdrawn',
  // Lo dispara la ruta de la tarea por cada aviso que procesa, salga o no el correo.
  'identity_request_expired',
  'identity_request_approved',
  'identity_request_rejected',
  // Una cuenta en el tope intenta enviar un pedido.
  'identity_cap_reached',
] as const

export type AnalyticsEvent = (typeof EVENTS)[number]

type Origin = { origin: IdentityOrigin }

// Las propiedades de los eventos que las llevan, tipadas por evento: nunca un id ni un texto libre
// (FR-035). Las horas de revisión son un número redondeado, no un instante.
export type EventProps = {
  identity_offer_viewed: Origin
  identity_request_started: Origin
  identity_consent_accepted: Origin
  identity_request_sent: Origin
  identity_request_withdrawn: Origin
  identity_request_expired: Origin
  identity_request_approved: Origin & { review_hours: number }
  identity_request_rejected: Origin & { reason: RejectionReason; review_hours: number }
  identity_cap_reached: Origin
}
