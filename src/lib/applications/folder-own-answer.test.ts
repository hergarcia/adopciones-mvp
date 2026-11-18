// Covers: historia #298 (la respuesta propia en la carpeta de solicitudes de un animal)
import { describe, expect, it } from 'vitest'
import { folderOwnAnswer, folderQuestion } from './folder-own-answer'
import type { ApplicationStatus } from './types'

const PATIO = '¿Tenés patio cerrado?'
const MONTEVIDEO = '¿Vivís en Montevideo?'
const ANSWER = 'Sí, con muro de dos metros.'

function row(status: ApplicationStatus, question: string | null) {
  return { status, own: question === null ? null : { question, answer: ANSWER } }
}

describe('folderOwnAnswer', () => {
  it('con la pregunta de hoy muestra solo la respuesta', () => {
    expect(folderOwnAnswer(row('sent', PATIO), PATIO)).toEqual({ question: null, answer: ANSWER })
  })

  it('con una pregunta que se cambió después, muestra la que contestó arriba de la respuesta', () => {
    expect(folderOwnAnswer(row('sent', PATIO), MONTEVIDEO)).toEqual({
      question: PATIO,
      answer: ANSWER,
    })
  })

  it('con la pregunta sacada, muestra la que contestó', () => {
    expect(folderOwnAnswer(row('sent', PATIO), null)).toEqual({ question: PATIO, answer: ANSWER })
  })

  it('la que llegó antes de la pregunta se ve como siempre', () => {
    expect(folderOwnAnswer(row('sent', null), PATIO)).toBeNull()
  })

  it.each<ApplicationStatus>(['accepted', 'rejected', 'withdrawn', 'closed'])(
    'una %s no muestra la respuesta aunque la tenga',
    (status) => {
      expect(folderOwnAnswer(row(status, PATIO), PATIO)).toBeNull()
    },
  )
})

describe('folderQuestion', () => {
  it('arriba va la pregunta de hoy cuando alguien la solicitó', () => {
    expect(folderQuestion(PATIO, 1)).toBe(PATIO)
  })

  it('sin solicitudes o sin pregunta, nada', () => {
    expect(folderQuestion(PATIO, 0)).toBeNull()
    expect(folderQuestion(null, 3)).toBeNull()
  })
})
