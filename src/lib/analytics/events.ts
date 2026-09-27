// Los siete momentos de FR-032 de la historia #9, los siete de FR-024 de la #10, los cuatro de
// FR-014 de la #25 y los cuatro de FR-028 de la #53. Cada uno tiene un disparador exacto, y ningún par se dispara siempre en el
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
] as const

export type AnalyticsEvent = (typeof EVENTS)[number]
