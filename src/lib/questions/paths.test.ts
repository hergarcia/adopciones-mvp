// Covers: FR-001, FR-050 (la dirección de cada página y cuál es una página de contenido)
import { describe, expect, it } from 'vitest'
import {
  QUESTIONS_PATH,
  STATES_QUESTION,
  isQuestionPath,
  questionPath,
  questionSlugOf,
} from './paths'

describe('questionPath', () => {
  it('cuelga del índice', () => {
    expect(QUESTIONS_PATH).toBe('/preguntas')
    expect(questionPath('como-se-verifica')).toBe('/preguntas/como-se-verifica')
  })

  // Covers: historia #204, el enlace «¿Qué significa cada estado?» de «Mis animales»
  it('el enlace de «Mis animales» lleva a la página de los estados, que está publicada', () => {
    expect(questionPath(STATES_QUESTION)).toBe('/preguntas/que-significa-cada-estado')
    expect(isQuestionPath(questionPath(STATES_QUESTION))).toBe(true)
  })
})

describe('questionSlugOf', () => {
  it.each([
    ['/preguntas/como-se-verifica', 'como-se-verifica'],
    ['/preguntas/compromiso-y-seguimiento', 'compromiso-y-seguimiento'],
  ])('una página publicada da su slug: %s', (pathname, slug) => {
    expect(questionSlugOf(pathname)).toBe(slug)
    expect(isQuestionPath(pathname)).toBe(true)
  })

  it.each([
    ['/preguntas'],
    ['/preguntas/'],
    ['/preguntas/otra'],
    ['/preguntas/Como-Se-Verifica'],
    ['/preguntas/como-se-verifica/x'],
    ['/x/preguntas/como-se-verifica'],
    ['/otra-ruta/como-se-verifica'],
    ['/niveles'],
  ])('lo demás no es una página: %s', (pathname) => {
    expect(questionSlugOf(pathname)).toBeNull()
    expect(isQuestionPath(pathname)).toBe(false)
  })
})
