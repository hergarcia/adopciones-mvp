// Covers: US3-AS1, US3-AS2, US3-AS3, US3-AS4, US3-AS5, FR-023, FR-024 (research R11)
import { describe, expect, it } from 'vitest'
import { petViewOrigin, visitMarks } from './visit-origin'

const HOST = 'adopciones.test'
const visit = { marked: false, referer: null, host: HOST, utmSource: null }

describe('petViewOrigin', () => {
  it('con la marca de Compartir es «compartido», venga de donde venga', () => {
    for (const referer of [
      null,
      'https://l.facebook.com/l.php?u=x',
      'https://adopciones.test/animales',
      'https://www.google.com/',
    ]) {
      expect(petViewOrigin({ ...visit, marked: true, referer })).toBe('shared')
    }
  })

  it.each([
    ['https://adopciones.test/animales', 'listing'],
    ['https://adopciones.test/animales?especie=gato&mostrar=48', 'listing'],
    ['https://adopciones.test/', 'home'],
    ['https://adopciones.test/?a=1', 'home'],
    ['https://adopciones.test/p/x', 'site'],
    ['https://adopciones.test/animales/k3x9p2qa7m', 'site'],
  ])('sin la marca, desde %s de este sitio es %s', (referer, origin) => {
    expect(petViewOrigin({ ...visit, referer })).toBe(origin)
  })

  it.each([
    ['https://m.facebook.com/', 'social'],
    ['https://www.google.com.uy/', 'search'],
    ['https://gemini.google.com/app', 'assistant'],
  ])('sin la marca, desde %s es %s', (referer, origin) => {
    expect(petViewOrigin({ ...visit, referer })).toBe(origin)
  })

  // ChatGPT no manda `referer` y suma `utm_source=chatgpt.com`.
  it('el utm_source de un asistente gana sobre un buscador o una red, no sobre este sitio', () => {
    expect(petViewOrigin({ ...visit, utmSource: 'chatgpt.com' })).toBe('assistant')
    expect(
      petViewOrigin({ ...visit, referer: 'https://www.google.com/', utmSource: 'ChatGPT.com' }),
    ).toBe('assistant')
    expect(
      petViewOrigin({ ...visit, referer: 'https://adopciones.test/', utmSource: 'chatgpt.com' }),
    ).toBe('home')
  })

  it('un utm_source que no es de un asistente no dice nada', () => {
    expect(petViewOrigin({ ...visit, utmSource: 'google.com' })).toBe('unknown')
    expect(
      petViewOrigin({ ...visit, referer: 'https://m.facebook.com/', utmSource: 'boletin' }),
    ).toBe('social')
  })

  it.each([
    [null],
    [''],
    ['no es una dirección'],
    ['https://otro.test/'],
    ['https://otro.test/animales'],
    ['https://facebook.com.evil.com/'],
  ])('desde %s es «sin origen conocido»', (referer) => {
    expect(petViewOrigin({ ...visit, referer })).toBe('unknown')
  })

  it('sin host conocido, nada es de este sitio', () => {
    expect(
      petViewOrigin({ ...visit, host: null, referer: 'https://adopciones.test/animales' }),
    ).toBe('unknown')
  })
})

describe('visitMarks', () => {
  it('?desde=compartir es la marca; otro valor, repetido o ninguno, no', () => {
    expect(visitMarks({ desde: 'compartir' }).marked).toBe(true)
    expect(visitMarks({ desde: 'otra' }).marked).toBe(false)
    expect(visitMarks({ desde: 'resumen' }).marked).toBe(false)
    expect(visitMarks({ desde: ['compartir', 'compartir'] }).marked).toBe(false)
    expect(visitMarks({}).marked).toBe(false)
  })

  it('el utm_source pasa solo cuando viene uno', () => {
    expect(visitMarks({ utm_source: 'chatgpt.com' }).utmSource).toBe('chatgpt.com')
    expect(visitMarks({ utm_source: ['chatgpt.com', 'x'] }).utmSource).toBeNull()
    expect(visitMarks({}).utmSource).toBeNull()
  })
})
