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
