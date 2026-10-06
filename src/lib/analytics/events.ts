import type { ContactKind } from '@/lib/contact/contact-match'
import type { ReportReason, ReportResolution } from '@/lib/moderation/types'
import type { AddedOption } from '@/lib/pets/listing-query'
import type { PetReviewKind } from '@/lib/pets/review-types'
import type { PetState, TakedownReason } from '@/lib/pets/types'
import type { PetField } from '@/lib/schemas/pet'
import type { QuestionId } from '@/lib/applications/questionnaire'
import type { CloseReason } from '@/lib/applications/types'
import type { IdentityOrigin, RejectionReason } from '@/lib/verification/identity'

// Los siete momentos de FR-032 de la historia #9, los siete de FR-024 de la #10, los cuatro de
// FR-014 de la #25, los nueve de FR-035 de la #11, los dos de FR-019 de la #35 y los cuatro de
// FR-028 de la #53, los ocho de FR-028 de la #12, los cuatro de FR-023 de la #57, los de FR-032 de
// la #59, los de la portada (#61) y los seis de FR-050 de la #13. Cada uno tiene un disparador
// exacto, y ningún par se dispara siempre en el mismo instante: dos nombres para un mismo hecho no
// miden nada.
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
  // Se abre o se recarga el listado, con su origen; no con «Ver más» ni al volver atrás desde una
  // ficha.
  'listing_viewed',
  // Una opción que se marca en un filtro, no al desmarcarla ni al abrir un enlace que ya la trae.
  'listing_filter_used',
  // Se abre o se recarga una ficha a la vista, con su origen. No la del propio publicador.
  'pet_viewed',
  // Se toca «Compartir», en la ficha o en «Mis animales».
  'pet_share_tapped',
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
  // El publicador marca en proceso o disponible, pausa, reanuda o marca adoptado (historia #59).
  'pet_status_changed',
  // Renovar: 30 días nuevos sin cambiar el estado, desde «Mis animales» o desde el correo.
  'pet_renewed',
  // Una vencida o una adoptada vuelve a Animales en adopción.
  'pet_republished',
  // El publicador borra una publicación, después de confirmar.
  'pet_deleted',
  // Sale el correo «¿sigue disponible?» de un vencimiento. Lo dispara la tarea, sin visita.
  'pet_reminder_sent',
  // Una publicación disponible o en proceso vence sin renovarse. Lo dispara la tarea, sin visita.
  'pet_expired',
  // Quien administra marca revisada una publicación nueva o editada. Sin la marca de la visita.
  'pet_reviewed',
  // Quien administra da de baja una publicación, con el motivo. Sin la marca de la visita.
  'pet_taken_down',
  // Se dibuja la portada para alguien que no es un lector de vista previa (historia #61).
  'home_viewed',
  // Se pide publicar desde la portada de este sitio, antes de la puerta de sesión y teléfono.
  'home_publish_tapped',
  // Un reporte nuevo queda guardado, con el motivo; no uno que ya estaba (historia #13, FR-050).
  'person_reported',
  // Un bloqueo nuevo queda hecho; no el segundo toque de uno que ya estaba.
  'person_blocked',
  // Un bloqueo se deshace; no el que ya estaba deshecho.
  'person_unblocked',
  // Quien administra suspende una cuenta, desde un reporte o desde el perfil. Sin la marca de la
  // visita.
  'account_suspended',
  // Quien administra reactiva una cuenta. Sin la marca de la visita.
  'account_reactivated',
  // Un reporte se cierra: uno por reporte, también por cada uno que cierra una suspensión, con las
  // horas redondeadas desde que se hizo. Sin la marca de la visita.
  'report_closed',
  // Se abre la ruta de «Quiero adoptar», con o sin sesión, antes de decidir qué pantalla ve
  // (historia #63, research R11).
  'apply_tapped',
  // Esa ruta frena a la persona antes del cuestionario: teléfono, identidad, límite, o un animal que
  // no recibe solicitudes.
  'apply_stopped',
  // La primera respuesta tocada en un cuestionario, no al volver con un borrador.
  'application_started',
  // Se deja el cuestionario sin enviar, con la última pregunta contestada.
  'application_abandoned',
  // Una solicitud nueva queda enviada; no el reintento de un intento que ya había llegado.
  'application_sent',
  // Quien solicitó retira una activa, con los días desde que la mandó; no el segundo toque.
  'application_withdrawn',
  // Una solicitud se cierra por lo que le pasó al animal o a una de las personas: uno por cada una,
  // con su motivo, registrado por la acción que lo provocó.
  'application_closed',
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
  // Sin el código del animal ni la cuenta: la historia #57 no mide qué animal miró quién (FR-023).
  listing_filter_used: AddedOption
  listing_viewed: { origin: ListingViewOrigin }
  pet_viewed: { origin: PetViewOrigin }
  pet_share_tapped: { from: ShareOrigin }
  public_profile_viewed: { origin: ViewOrigin }
  profile_contact_rejected: { field: ProfileContactField; kind: ContactKind }
  pet_status_changed: { from: PetState; to: PetState; days_since_published: number }
  pet_renewed: { via: RenewalVia }
  pet_republished: { from: 'expired' | 'adopted'; via: RenewalVia }
  pet_deleted: { from: PetState }
  pet_expired: { from: 'available' | 'in_process'; days_since_published: number }
  pet_reviewed: { kind: PetReviewKind; review_hours: number }
  pet_taken_down: { kind: PetReviewKind; reason: TakedownReason; review_hours: number }
  person_reported: { reason: ReportReason }
  account_suspended: { from: SuspensionOrigin }
  report_closed: { resolution: ReportResolution; hours: number }
  apply_tapped: { signedIn: boolean; level: ApplicantLevel; required: 1 | 2 }
  apply_stopped: { by: ApplyStop }
  application_started: { proposed: boolean }
  application_abandoned: { lastQuestion: QuestionId | 'none' }
  application_sent: { seconds: number; proposedUsed: boolean; after: ApplyAfter | null }
  application_withdrawn: { days: number }
  application_closed: { reason: CloseReason }
}

/** El nivel de quien toca «Quiero adoptar»: 0 sin teléfono verificado o sin sesión. */
export type ApplicantLevel = 0 | 1 | 2 | 3
export type ApplyStop = 'phone' | 'identity' | 'limit' | 'not_receiving'
/** Mandó la solicitud después de verificar algo que la frenó. */
export type ApplyAfter = 'phone' | 'identity'

/** Desde dónde se suspendió: un reporte o el perfil (historia #13). */
export type SuspensionOrigin = 'report' | 'profile'

/** Desde dónde se renovó o se volvió a publicar: «Mis animales» o el correo «¿sigue disponible?». */
export type RenewalVia = 'my_pets' | 'email'

export type PetViewOrigin = 'listing' | 'home' | 'outside'
export type ListingViewOrigin = 'home' | 'elsewhere'
export const SHARE_ORIGINS = ['pet', 'my_pets'] as const
export type ShareOrigin = (typeof SHARE_ORIGINS)[number]

// Un evento con sus propiedades, para quien arma una lista de eventos antes de mandarla.
export type TrackedEvent = {
  [E in AnalyticsEvent]: E extends keyof EventProps
    ? { name: E; props: EventProps[E] }
    : { name: E; props?: undefined }
}[AnalyticsEvent]
