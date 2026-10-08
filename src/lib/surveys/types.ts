/** Los tres desenlaces que ofrecen la encuesta (research R3); la base guarda estas claves. */
export const SURVEY_MOMENTS = ['gave', 'adopted', 'not_chosen'] as const
export type SurveyMoment = (typeof SURVEY_MOMENTS)[number]

/** Las tres opciones de cada momento, en el orden en que se ofrecen (data-model §survey_answers). */
export const SURVEY_OPTIONS = {
  gave: ['yes', 'maybe', 'no'],
  adopted: ['yes', 'somewhat', 'no'],
  not_chosen: ['yes', 'maybe', 'back_to_groups'],
} as const satisfies Record<SurveyMoment, readonly [string, string, string]>

export type SurveyOption<M extends SurveyMoment = SurveyMoment> = (typeof SURVEY_OPTIONS)[M][number]

/** Todas, sin repetir: lo que la base puede guardar en algún momento. */
export const ALL_SURVEY_OPTIONS = [
  'yes',
  'maybe',
  'no',
  'somewhat',
  'back_to_groups',
] as const satisfies readonly SurveyOption[]

export const SURVEY_OFFER_STATES = ['pending', 'answered', 'dismissed', 'skipped'] as const
export type SurveyOfferState = (typeof SURVEY_OFFER_STATES)[number]

/** La oferta de una persona para un desenlace, como la devuelve la base al abrir la pantalla. */
export type SurveyOffer = {
  offerId: string
  moment: SurveyMoment
  state: SurveyOfferState
  /** Se ofreció en esta llamada: es la que mide `survey_offered`. */
  newlyOffered: boolean
  /** El animal, solo en Mis animales. */
  petId?: string
}

/** Lo que devuelven responder y cerrar en la base (research R7). */
export const SURVEY_OUTCOMES = [
  'answered',
  'already',
  'dismissed',
  'not_found',
  'invalid',
  'suspended',
] as const
export type SurveyOutcome = (typeof SURVEY_OUTCOMES)[number]

/** El largo de la respuesta libre, contado como `char_length` en la base. */
export const SURVEY_TEXT_MAX = 500

/** Desde cuántos caracteres se ve cuánto queda: antes no hace falta mirarlo. */
export const SURVEY_COUNTER_FROM = 400
