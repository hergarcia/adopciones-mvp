import type { ContactKind } from '@/lib/contact/contact-match'
import type { PetField } from '@/lib/schemas/pet'
import type { IdentityOrigin, RejectionReason } from '@/lib/verification/identity'

// Los siete momentos de FR-032 de la historia #9, los siete de FR-024 de la #10, los cuatro de
// FR-014 de la #25, los nueve de FR-035 de la #11, los dos de FR-019 de la #35 y los cuatro de
// FR-028 de la #53 y los ocho de FR-028 de la #12. Cada uno tiene un disparador exacto, y ningún par se dispara siempre en el mismo
// instante: dos nombres para un mismo hecho no miden nada.
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
  // Llega el reporte de un toque de guardar o reintentar el perfil que no llegó. Se anota tarde,
  // cuando vuelve la conexión o antes del próximo intento: en el momento no hay cómo mandarlo.
  'profile_save_failed',
  // El perfil se guarda después de al menos un fallo en la misma visita a la pantalla.
  'profile_save_recovered',
  // El primer dato o la primera foto en un formulario de publicar vacío; no con lo escrito
  // recuperado, que es la misma carga (lib/pets/draft.ts).
  'pet_publish_started',
  // Una publicación nueva guardada, con cuántas fotos, cuánto tardó desde que empezó y qué número
  // de publicación es para esa persona (1, 2 o 3+). No un reintento de un intento ya publicado.
  'pet_published',
  // Un guardado de una edición que llegó a la base.
  'pet_edited',
  // Un campo rechazado por una vía de contacto, con el campo y el tipo; lo detecte el formulario
  // o la acción.
  'pet_contact_rejected',
  // El perfil público se dibuja para alguien que no es la dueña ni una vista previa, y sin la marca
  // de una acción propia recién hecha (lib/analytics/view-origin.ts). No un «no existe».
  'public_profile_viewed',
  // Se manda el enlace al perfil público desde la hoja de compartir del teléfono, se copia, o se
  // muestra para copiarlo a mano.
  'profile_link_copied',
  // Un aval nuevo queda dado; no el reintento de uno que ya estaba.
  'vouch_given',
  'vouch_withdrawn',
  'vouch_removed',
  // Un aval dado hace pasar a quien lo recibe de nivel 2 a 3. La vuelta sola de un aval en pausa
  // no, porque no la produce ninguna acción.
  'level_three_reached',
  // Se dibuja la explicación de los niveles.
  'levels_explained',
  // El nombre o la localidad del perfil rechazados por una vía de contacto, lo detecte el
  // formulario o la acción. El número de puerta no es contacto y no cuenta.
  'profile_contact_rejected',
] as const

export type AnalyticsEvent = (typeof EVENTS)[number]

export const SAVE_FAILURE_REASONS = ['offline', 'no_response'] as const
export type SaveFailureReason = (typeof SAVE_FAILURE_REASONS)[number]

export const SAVE_MOMENTS = ['create', 'edit'] as const
export type SaveMoment = (typeof SAVE_MOMENTS)[number]

type Origin = { origin: IdentityOrigin }

/** Llegó navegando dentro del sitio, o desde afuera: un enlace pegado, WhatsApp, un favorito. */
export const VIEW_ORIGINS = ['link', 'site'] as const
export type ViewOrigin = (typeof VIEW_ORIGINS)[number]

export const PROFILE_CONTACT_FIELDS = ['displayName', 'locality'] as const
export type ProfileContactField = (typeof PROFILE_CONTACT_FIELDS)[number]

// Las propiedades de los eventos que las llevan, tipadas por evento: nunca un id ni un texto libre,
// que es por donde se escaparía un dato de la persona (FR-035 de la #11, FR-022 de la #35, FR-028
// de la #53). Las horas de revisión son un número redondeado, no un instante.
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
  profile_save_failed: { reason: SaveFailureReason; moment: SaveMoment; first: boolean }
  profile_save_recovered: { moment: SaveMoment }
  pet_published: { photos: number; seconds: number; ordinal: string }
  pet_contact_rejected: { field: PetField; kind: ContactKind }
  public_profile_viewed: { origin: ViewOrigin }
  profile_contact_rejected: { field: ProfileContactField; kind: ContactKind }
}

// Un evento con sus propiedades, para quien arma una lista de eventos antes de mandarla.
export type TrackedEvent = {
  [E in AnalyticsEvent]: E extends keyof EventProps
    ? { name: E; props: EventProps[E] }
    : { name: E; props?: undefined }
}[AnalyticsEvent]
