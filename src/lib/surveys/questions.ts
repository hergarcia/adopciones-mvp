import { SURVEY_OPTIONS, type SurveyMoment, type SurveyOption } from './types'

/** La pregunta de un momento y sus tres opciones, con las claves de `surveys` en es.json. */
export type SurveyQuestion = {
  question: `questions.${SurveyMoment}`
  /** Cada opción con su etiqueta: la misma palabra en los tres momentos. */
  options: { value: SurveyOption; label: `options.${SurveyOption}` }[]
}

export function surveyQuestion(moment: SurveyMoment): SurveyQuestion {
  return {
    question: `questions.${moment}`,
    options: SURVEY_OPTIONS[moment].map((value) => ({ value, label: `options.${value}` as const })),
  }
}

/** Si la opción es una de las tres de ese momento: «Más o menos» es solo de quien adoptó. */
export function isSurveyOption(moment: SurveyMoment, option: string): boolean {
  return SURVEY_OPTIONS[moment].some((value) => value === option)
}
