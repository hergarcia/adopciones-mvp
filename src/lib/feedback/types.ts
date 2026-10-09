/**
 * Las pantallas de una opinión (research R9); la base repite la lista en
 * `private.feedback_screen_valid`. Solo `pet` y `profile` llevan sujeto.
 */
export const FEEDBACK_SCREENS = [
  'pet',
  'profile',
  'home',
  'listing',
  'levels',
  'my_pets',
  'my_application',
  'my_applications',
  'publisher_applications',
  'my_profile',
  'verification',
  'review',
  'sign_in',
  'suspended',
  'other',
] as const
export type FeedbackScreen = (typeof FEEDBACK_SCREENS)[number]

/** El largo de una opinión, contado como `char_length` en la base. */
export const FEEDBACK_TEXT_MAX = 1000

/** Cuántas opiniones manda un navegador por día de Uruguay (FR-023). */
export const FEEDBACK_DAILY_MAX = 5

/** Lo que devuelve `send_feedback` en la base (research R8). */
export const FEEDBACK_OUTCOMES = ['sent', 'already', 'limit', 'invalid'] as const
export type FeedbackOutcome = (typeof FEEDBACK_OUTCOMES)[number]

/** Desde cuántos caracteres aparece la cuenta en Opinar: antes no hace falta mirarla. */
export const FEEDBACK_COUNTER_FROM = 800
