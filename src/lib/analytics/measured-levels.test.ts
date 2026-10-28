// Covers: FR-016, FR-017, FR-018, FR-020 (el nivel medido, el sí o no, y nada inventado)
import { describe, expect, it } from 'vitest'
import {
  applicantProps,
  applicationMeasureOf,
  measuredLevelOf,
  publisherLevelProps,
} from './measured-levels'

describe('measuredLevelOf', () => {
  it('los niveles de la chapita, del 0 al 3, pasan tal cual', () => {
    expect([0, 1, 2, 3].map(measuredLevelOf)).toEqual([0, 1, 2, 3])
  })

  it('lo que no es un nivel no se recorta ni se redondea: no se pudo leer', () => {
    expect([-1, 4, 1.5, null, undefined, '2'].map(measuredLevelOf)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
    ])
  })
})

describe('applicationMeasureOf', () => {
  it('una fila completa da quien solicitó con su nivel y su sí o no, y el nivel de quien publicó', () => {
    expect(
      applicationMeasureOf({ applicant_level: 2, applicant_follow_up: false, publisher_level: 3 }),
    ).toEqual({ applicant: { level: 2, followUp: false }, publisherLevel: 3 })
    expect(
      applicationMeasureOf({ applicant_level: 0, applicant_follow_up: true, publisher_level: 1 }),
    ).toEqual({ applicant: { level: 0, followUp: true }, publisherLevel: 1 })
  })

  it('sin fila no hay medida', () => {
    expect(applicationMeasureOf(undefined)).toBeNull()
  })

  it('quien solicitó sin nivel o sin el sí o no se queda sin medida, sin tocar a quien publicó', () => {
    expect(
      applicationMeasureOf({
        applicant_level: null,
        applicant_follow_up: null,
        publisher_level: 2,
      }),
    ).toEqual({ applicant: null, publisherLevel: 2 })
    expect(
      applicationMeasureOf({ applicant_level: 1, applicant_follow_up: null, publisher_level: 2 }),
    ).toEqual({ applicant: null, publisherLevel: 2 })
    expect(
      applicationMeasureOf({
        applicant_level: null,
        applicant_follow_up: true,
        publisher_level: 2,
      }),
    ).toEqual({ applicant: null, publisherLevel: 2 })
  })

  it('un nivel fuera de rango se lee como «no se pudo leer»', () => {
    expect(
      applicationMeasureOf({ applicant_level: 7, applicant_follow_up: true, publisher_level: -1 }),
    ).toEqual({ applicant: null, publisherLevel: null })
  })
})

describe('applicantProps', () => {
  it('sin medida, ninguna propiedad', () => {
    expect(applicantProps(null)).toEqual({})
  })

  it('con medida, exactamente el nivel y el sí o no', () => {
    expect(applicantProps({ level: 3, followUp: true })).toStrictEqual({
      applicant_level: 3,
      applicant_follow_up: true,
    })
    expect(applicantProps({ level: 0, followUp: false })).toStrictEqual({
      applicant_level: 0,
      applicant_follow_up: false,
    })
  })
})

describe('publisherLevelProps', () => {
  it('sin nivel, ninguna propiedad; con nivel, solo ese', () => {
    expect(publisherLevelProps(null)).toEqual({})
    expect(publisherLevelProps(0)).toStrictEqual({ publisher_level: 0 })
    expect(publisherLevelProps(2)).toStrictEqual({ publisher_level: 2 })
  })
})
