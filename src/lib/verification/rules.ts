// Los números de la verificación de teléfono (spec §Assumptions, «Números del código»). Son su
// única fuente: las funciones de la base los reciben como parámetros y no repiten ninguno.
export const CODE_LENGTH = 6
export const CODE_TTL_MINUTES = 10
export const MAX_ATTEMPTS = 5
export const MIN_GAP_SECONDS = 60
export const ACCOUNT_DAILY_CAP = 5
export const NUMBER_DAILY_CAP = 10
export const SITE_DAILY_CAP = 200
export const WINDOW_HOURS = 24
export const PENDING_TTL_DAYS = 7

export const URUGUAY_TIME_ZONE = 'America/Montevideo'

/** Las reglas con el formato de intervalo que esperan las funciones de la base. */
export const DB_RULES = {
  p_code_ttl: `${CODE_TTL_MINUTES} minutes`,
  p_min_gap: `${MIN_GAP_SECONDS} seconds`,
  p_window: `${WINDOW_HOURS} hours`,
  p_account_cap: ACCOUNT_DAILY_CAP,
  p_number_cap: NUMBER_DAILY_CAP,
  p_site_cap: SITE_DAILY_CAP,
  p_max_attempts: MAX_ATTEMPTS,
  p_pending_ttl: `${PENDING_TTL_DAYS} days`,
} as const

// Los números de la verificación de identidad (historia #11). Igual que los del teléfono, son su
// única fuente: las funciones de la base los reciben como parámetros.

/** Un pedido vence a los 7 días exactos de enviado (FR-028). */
export const IDENTITY_REVIEW_TTL_DAYS = 7
/** La ventana del tope y lo que dura un rechazo o un vencimiento guardado (FR-027, FR-031). */
export const IDENTITY_REJECTION_WINDOW_DAYS = 30
/** Rechazos en la ventana que dejan a la cuenta sin intentos (FR-027). */
export const IDENTITY_REJECTION_CAP = 3
/** Lo que se le dice a la persona que suele tardar la revisión (FR-010). */
export const IDENTITY_EXPECTED_REVIEW_DAYS = 2
/** El tamaño máximo de la foto que elige la persona, antes de procesarla (FR-006). */
export const IDENTITY_PHOTO_MAX_BYTES = 10 * 1024 * 1024
/** El lado mayor de la foto procesada, y el de la segunda vuelta si no entra (plan §3). */
export const IDENTITY_PHOTO_MAX_SIDE = 1600
export const IDENTITY_PHOTO_FALLBACK_SIDE = 1280
/** Lo que pesa como mucho cada foto procesada: dos entran en el límite de 1 MB de una acción. */
export const IDENTITY_PHOTO_TARGET_BYTES = 450 * 1024
/** Cada cuánto pregunta la pantalla de un pedido si sigue abierto (FR-021: a más tardar 30 s). */
export const REVIEW_POLL_MS = 10_000

/** Las reglas de identidad con el formato que esperan las funciones de la base. */
export const IDENTITY_DB_RULES = {
  p_ttl: `${IDENTITY_REVIEW_TTL_DAYS} days`,
  p_window_days: IDENTITY_REJECTION_WINDOW_DAYS,
  p_cap: IDENTITY_REJECTION_CAP,
  p_pending_ttl: `${PENDING_TTL_DAYS} days`,
} as const
