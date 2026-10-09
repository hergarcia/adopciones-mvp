// Covers: FR-050, FR-051, FR-053 (de dónde se llega a las preguntas y el toque en la acción)
import { describe, expect, it } from 'vitest'
import { questionActionEvent, questionViewEvent, questionsIndexViewEvent } from './question-events'

const HOST = 'sitio.test'
const PERSON = 'Mozilla/5.0 (iPhone)'
const PREVIEW = 'WhatsApp/2.23'
const from = (path: string) => `https://${HOST}${path}`

describe('questionViewEvent', () => {
  const view = (referer: string | null, userAgent = PERSON) =>
    questionViewEvent({ slug: 'como-se-verifica', referer, host: HOST, userAgent })

  it.each([
    [from('/preguntas'), 'index'],
    [from('/niveles?nivel=2&desde=/perfil/x'), 'levels'],
    [from('/verificar-identidad'), 'identity_request'],
    [from('/verificar-identidad?pedir=1'), 'identity_request'],
    [from('/preguntas/reconocer-una-estafa'), 'question'],
    [from('/preguntas/no-existe'), 'link'],
    [from('/animales'), 'link'],
    [from('/'), 'link'],
    ['https://otro.test/preguntas', 'link'],
    ['https://otro.test/niveles', 'link'],
    ['https://otro.test/verificar-identidad', 'link'],
    ['https://otro.test/preguntas/reconocer-una-estafa', 'link'],
    [null, 'link'],
    ['no es una dirección', 'link'],
  ])('desde %s es %s', (referer, origin) => {
    expect(view(referer)).toEqual({
      name: 'question_viewed',
      props: { page: 'como-se-verifica', origin },
    })
  })

  it('un lector de vista previa no es una apertura', () => {
    expect(view(from('/preguntas'), PREVIEW)).toBeNull()
  })
})

describe('questionsIndexViewEvent', () => {
  const view = (referer: string | null, userAgent: string | null = PERSON) =>
    questionsIndexViewEvent({ referer, host: HOST, userAgent })

  it.each([
    [from('/animales'), 'footer'],
    [from('/preguntas/como-se-verifica'), 'footer'],
    ['https://otro.test/animales', 'link'],
    [null, 'link'],
  ])('desde %s es %s', (referer, origin) => {
    expect(view(referer)).toEqual({ name: 'questions_index_viewed', props: { origin } })
  })

  it('sin agente es una persona', () => {
    expect(view(null, null)).toEqual({ name: 'questions_index_viewed', props: { origin: 'link' } })
  })

  it('un lector de vista previa no es una apertura', () => {
    expect(view(from('/animales'), PREVIEW)).toBeNull()
  })
})

describe('questionActionEvent', () => {
  const tap = (referer: string | null, destination: string, userAgent = PERSON) =>
    questionActionEvent({ referer, host: HOST, destination, userAgent })

  it.each([
    ['/preguntas/antes-de-entregar', '/mis-animales/publicar', 'antes-de-entregar'],
    ['/preguntas/que-exige-uruguay', '/mis-animales/publicar', 'que-exige-uruguay'],
    ['/preguntas/reconocer-una-estafa', '/animales', 'reconocer-una-estafa'],
    ['/preguntas/compromiso-y-seguimiento', '/animales', 'compromiso-y-seguimiento'],
    ['/preguntas/como-se-verifica', '/verificar-identidad', 'como-se-verifica'],
  ])('desde %s, ir a %s es su acción', (path, destination, page) => {
    expect(tap(from(path), destination)).toEqual({ name: 'question_action_used', props: { page } })
  })

  it('la cabecera hacia otra pantalla no es la acción de la página', () => {
    expect(tap(from('/preguntas/antes-de-entregar'), '/animales')).toBeNull()
    expect(tap(from('/preguntas/como-se-verifica'), '/mis-animales/publicar')).toBeNull()
  })

  it('el índice, otra pantalla, otro sitio o sin referer no cuentan', () => {
    expect(tap(from('/preguntas'), '/animales')).toBeNull()
    expect(tap(from('/'), '/mis-animales/publicar')).toBeNull()
    expect(tap('https://otro.test/preguntas/reconocer-una-estafa', '/animales')).toBeNull()
    expect(tap(null, '/animales')).toBeNull()
  })

  it('un lector de vista previa no toca nada', () => {
    expect(tap(from('/preguntas/reconocer-una-estafa'), '/animales', PREVIEW)).toBeNull()
  })
})
