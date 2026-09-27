// Los números de la historia #53. Son su única fuente: el schema, el procesado de fotos, el
// formulario y las funciones de la base los toman de acá.
export const MAX_PHOTOS = 5
export const NAME_MAX = 30
export const DESCRIPTION_MAX = 2000
/** Desde cuántos caracteres se ve cuánto queda. */
export const NAME_COUNTER_FROM = 25
export const DESCRIPTION_COUNTER_FROM = 1800

export const AGE_RANGE = {
  months: { min: 1, max: 11 },
  years: { min: 1, max: 25 },
} as const

/** El lado largo de cada tamaño guardado, en píxeles. */
export const PHOTO_SIDES = { thumb: 400, card: 800, full: 1600 } as const
export const THUMBHASH_SIDE = 100
export const PHOTO_QUALITIES = [0.82, 0.72, 0.62] as const
export const MAX_PHOTO_FILE_BYTES = 1024 * 1024
export const MAX_PREPARED_PHOTO_BYTES = 1.5 * 1024 * 1024

export const STAGED_TTL_HOURS = 24
export const SAVE_TIMEOUT_MS = 2 * 60 * 1000
export const DRAFT_TTL_DAYS = 30
export const SIGNED_URL_TTL_SECONDS = 60 * 60

/** Lo que las funciones de la base reciben como intervalo. */
export const PET_DB_RULES = {
  p_staged_ttl: `${STAGED_TTL_HOURS} hours`,
} as const
