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
}

/** Un número de 0 a 3; cualquier otra cosa es «no se pudo leer», nunca un nivel recortado. */
export function measuredLevelOf(value: unknown): MeasuredLevel | null {
  return MEASURED_LEVELS.find((level) => level === value) ?? null
}

type MeasureRow = {
  applicant_level: unknown
  applicant_follow_up: unknown
  publisher_level: unknown
}

/** La fila de `application_measure`; sin fila, sin medida. */
export function applicationMeasureOf(row: MeasureRow | undefined): ApplicationMeasure | null {
  if (row === undefined) return null
  const level = measuredLevelOf(row.applicant_level)
  const followUp = row.applicant_follow_up
  return {
    applicant: level === null || typeof followUp !== 'boolean' ? null : { level, followUp },
    publisherLevel: measuredLevelOf(row.publisher_level),
  }
}

export type ApplicantProps = { applicant_level?: MeasuredLevel; applicant_follow_up?: boolean }

export function applicantProps(measure: ApplicantMeasure | null): ApplicantProps {
  return measure === null
    ? {}
    : { applicant_level: measure.level, applicant_follow_up: measure.followUp }
}

export function publisherLevelProps(level: MeasuredLevel | null): {
  publisher_level?: MeasuredLevel
} {
  return level === null ? {} : { publisher_level: level }
}
