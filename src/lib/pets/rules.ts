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

// Los números de la historia #57 (ver los animales y compartir la ficha).
export const LISTING_PAGE_SIZE = 24
/** Hasta cuántas muestra una dirección con `mostrar`: diez tandas (spec §Assumptions). */
export const LISTING_MAX_SHOWN = 240

/** Los tramos de edad del filtro, en meses de la edad de hoy: `[desde, hasta)`. */
export const AGE_BANDS = {
  puppy: { from: 0, to: 12 },
  young: { from: 12, to: 36 },
  adult: { from: 36, to: 96 },
  senior: { from: 96, to: null },
} as const

// El alfabeto de Crockford en minúscula, sin i l o u: se dicta y se copia sin confundir letras. La
// base tiene el mismo patrón en su check, y un test comprueba que aceptan los mismos casos.
export const PET_CODE_PATTERN = /^[0-9a-hjkmnp-tv-z]{10}$/

/** Pasado esto, una página vuelve a firmar sus fotos: las firmas duran una hora. */
export const STALE_PAGE_MINUTES = 50
/** Lo que WhatsApp suele aceptar como imagen de una vista previa. */
export const SHARE_IMAGE_MAX_BYTES = 300 * 1024

// Los números de la historia #59 (mantener al día cada publicación). La base tiene los dos primeros
// en `private.pet_lifetime()` y `private.pet_reminder_lead()`, y un test compara los dos lados.
export const PET_LIFETIME_DAYS = 30
export const PET_REMINDER_DAYS = 7
export const RENEWAL_LINK_DAYS = 30
export const TAKEDOWN_NOTE_MAX = 300
export const PET_REVIEW_PAGE = 20
