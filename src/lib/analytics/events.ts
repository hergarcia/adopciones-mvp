// Los siete momentos de FR-032. Cada uno tiene un disparador exacto, y ningún par se dispara
// siempre en el mismo instante: dos nombres para un mismo hecho no miden nada.
export const EVENTS = [
  'account_creation_started',
  'account_creation_finished',
  'signed_in_with_link',
  'signed_in_with_google',
  'profile_edited',
  'signed_out',
  'account_deleted',
] as const

export type AnalyticsEvent = (typeof EVENTS)[number]
