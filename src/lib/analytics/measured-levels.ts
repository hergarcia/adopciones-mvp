// El nivel que viaja con un momento de la medición (historia #236): el de la chapita, leído en el
// instante. Lo que no se pudo leer es `null` y la propiedad no sale; nunca un nivel por defecto
// (FR-018).

export const MEASURED_LEVELS = [0, 1, 2, 3] as const
export type MeasuredLevel = (typeof MEASURED_LEVELS)[number]

/** Quien solicitó: su nivel de ahora y si adoptó y respondió al menos un seguimiento. */
export type ApplicantMeasure = { level: MeasuredLevel; followUp: boolean }

export type ApplicationMeasure = {
  applicant: ApplicantMeasure | null
  publisherLevel: MeasuredLevel | null
  /** Si la solicitud contestó una pregunta propia (historia #292); null si no se pudo leer. */
  ownQuestion: boolean | null
}

/** Un número de 0 a 3; cualquier otra cosa es «no se pudo leer», nunca un nivel recortado. */
export function measuredLevelOf(value: unknown): MeasuredLevel | null {
  return MEASURED_LEVELS.find((level) => level === value) ?? null
}

type MeasureRow = {
  applicant_level: unknown
  applicant_follow_up: unknown
  publisher_level: unknown
  own_question: unknown
}

/** La fila de `application_measure`; sin fila, sin medida. */
export function applicationMeasureOf(row: MeasureRow | undefined): ApplicationMeasure | null {
  if (row === undefined) return null
  const level = measuredLevelOf(row.applicant_level)
  const followUp = row.applicant_follow_up
  return {
    applicant: level === null || typeof followUp !== 'boolean' ? null : { level, followUp },
    publisherLevel: measuredLevelOf(row.publisher_level),
    ownQuestion: typeof row.own_question === 'boolean' ? row.own_question : null,
  }
}

export type ApplicantProps = { applicant_level?: MeasuredLevel; applicant_follow_up?: boolean }

export function applicantProps(measure: ApplicantMeasure | null): ApplicantProps {
  return measure === null
    ? {}
    : { applicant_level: measure.level, applicant_follow_up: measure.followUp }
}

export function publisherLevelProps<Level extends MeasuredLevel>(
  level: Level | null,
): { publisher_level?: Level } {
  return level === null ? {} : { publisher_level: level }
}

export type OwnQuestionProps = { own_question?: boolean }

/** El sí o el no de la pregunta propia (historia #292), nunca su texto; sin lectura, no sale. */
export function ownQuestionProps(answered: boolean | null): OwnQuestionProps {
  return answered === null ? {} : { own_question: answered }
}
