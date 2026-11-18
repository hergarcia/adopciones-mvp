// Covers: FR-016, FR-017, FR-018, FR-020 (el nivel medido, el sí o no, y nada inventado)
import { describe, expect, it } from 'vitest'
import {
  applicantProps,
  applicationMeasureOf,
  measuredLevelOf,
  ownQuestionProps,
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

// Una fila de `application_measure` completa; cada caso cambia lo que prueba.
const ROW = {
  applicant_level: 2,
  applicant_follow_up: false,
  publisher_level: 1,
  own_question: false,
}

describe('applicationMeasureOf', () => {
  it('una fila completa da quien solicitó con su nivel y su sí o no, y el nivel de quien publicó', () => {
    expect(applicationMeasureOf({ ...ROW, applicant_level: 2, publisher_level: 3 })).toEqual({
      applicant: { level: 2, followUp: false },
      publisherLevel: 3,
      ownQuestion: false,
    })
    expect(applicationMeasureOf({ ...ROW, applicant_level: 0, applicant_follow_up: true })).toEqual(
      { applicant: { level: 0, followUp: true }, publisherLevel: 1, ownQuestion: false },
    )
  })

  it('sin fila no hay medida', () => {
    expect(applicationMeasureOf(undefined)).toBeNull()
  })

  it('quien solicitó sin nivel o sin el sí o no se queda sin medida, sin tocar a quien publicó', () => {
    const unread = { applicant: null, publisherLevel: 2, ownQuestion: false }
    expect(
      applicationMeasureOf({
        ...ROW,
        applicant_level: null,
        applicant_follow_up: null,
        publisher_level: 2,
      }),
    ).toEqual(unread)
    expect(
      applicationMeasureOf({
        ...ROW,
        applicant_level: 1,
        applicant_follow_up: null,
        publisher_level: 2,
      }),
    ).toEqual(unread)
    expect(
      applicationMeasureOf({
        ...ROW,
        applicant_level: null,
        applicant_follow_up: true,
        publisher_level: 2,
      }),
    ).toEqual(unread)
  })

  it('un nivel fuera de rango se lee como «no se pudo leer»', () => {
    expect(
      applicationMeasureOf({
        ...ROW,
        applicant_level: 7,
        applicant_follow_up: true,
        publisher_level: -1,
      }),
    ).toEqual({ applicant: null, publisherLevel: null, ownQuestion: false })
  })

  // Covers: #292 US5-AS3, FR-029 (el sí o el no de la pregunta propia, y nada inventado)
  it('si contestó una pregunta propia, tal cual; lo que no es un sí o un no queda sin leer', () => {
    expect(applicationMeasureOf({ ...ROW, own_question: true })?.ownQuestion).toBe(true)
    expect(applicationMeasureOf({ ...ROW, own_question: false })?.ownQuestion).toBe(false)
    expect(
      [null, undefined, 'true', 1].map((value) =>
        applicationMeasureOf({ ...ROW, own_question: value }),
      ),
    ).toEqual([
      { applicant: { level: 2, followUp: false }, publisherLevel: 1, ownQuestion: null },
      { applicant: { level: 2, followUp: false }, publisherLevel: 1, ownQuestion: null },
      { applicant: { level: 2, followUp: false }, publisherLevel: 1, ownQuestion: null },
      { applicant: { level: 2, followUp: false }, publisherLevel: 1, ownQuestion: null },
    ])
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

// Covers: #292 US5-AS2, US5-AS3, FR-029
describe('ownQuestionProps', () => {
  it('sin lectura, ninguna propiedad; con lectura, exactamente el sí o el no', () => {
    expect(ownQuestionProps(null)).toStrictEqual({})
    expect(ownQuestionProps(true)).toStrictEqual({ own_question: true })
    expect(ownQuestionProps(false)).toStrictEqual({ own_question: false })
  })
})
