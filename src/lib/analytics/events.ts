import type { ContactKind } from '@/lib/contact/pet-contact'
import type { AddedOption } from '@/lib/pets/listing-query'
import type { PetField } from '@/lib/schemas/pet'
import type { IdentityOrigin, RejectionReason } from '@/lib/verification/identity'

// Los siete momentos de FR-032 de la historia #9, los siete de FR-024 de la #10, los cuatro de
// FR-014 de la #25, los nueve de FR-035 de la #11, los dos de FR-019 de la #35 y los cuatro de
// FR-028 de la #53 y los cuatro de FR-023 de la #57. Cada uno tiene un disparador exacto, y ningún par se dispara siempre en el mismo
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
  // Se abre o se recarga el listado; no con «Ver más» ni al volver atrás desde una ficha.
  'listing_viewed',
  // Una opción que se marca en un filtro, no al desmarcarla ni al abrir un enlace que ya la trae.
  'listing_filter_used',
  // Se abre o se recarga una ficha a la vista, con su origen. No la del propio publicador.
  'pet_viewed',
  // Se toca «Compartir», en la ficha o en «Mis animales».
  'pet_share_tapped',
] as const

export type AnalyticsEvent = (typeof EVENTS)[number]

export const SAVE_FAILURE_REASONS = ['offline', 'no_response'] as const
export type SaveFailureReason = (typeof SAVE_FAILURE_REASONS)[number]

export const SAVE_MOMENTS = ['create', 'edit'] as const
export type SaveMoment = (typeof SAVE_MOMENTS)[number]

type Origin = { origin: IdentityOrigin }

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
  // Sin el código del animal ni la cuenta: la historia #57 no mide qué animal miró quién (FR-023).
  listing_filter_used: AddedOption
  pet_viewed: { origin: PetViewOrigin }
  pet_share_tapped: { from: ShareOrigin }
}

export type PetViewOrigin = 'listing' | 'outside'
export const SHARE_ORIGINS = ['pet', 'my_pets'] as const
export type ShareOrigin = (typeof SHARE_ORIGINS)[number]

// Un evento con sus propiedades, para quien arma una lista de eventos antes de mandarla.
export type TrackedEvent = {
  [E in AnalyticsEvent]: E extends keyof EventProps
    ? { name: E; props: EventProps[E] }
    : { name: E; props?: undefined }
}[AnalyticsEvent]
