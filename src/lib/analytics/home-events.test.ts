// Covers: US1, FR-029 (research R6, R8)
import { describe, expect, it } from 'vitest'
import { homePublishTapEvent, homeViewEvent, isHomeReferer } from './home-events'

const HOST = 'adopciones.test'
const BROWSER = 'Mozilla/5.0 (Linux; Android 14) Chrome/129.0 Mobile Safari/537.36'

describe('isHomeReferer', () => {
  it.each([
    ['https://adopciones.test/'],
    ['https://adopciones.test'],
    ['http://adopciones.test/?a=1'],
  ])('%s es la portada', (referer) => {
    expect(isHomeReferer(referer, HOST)).toBe(true)
  })

  it.each([
    [null],
    [''],
    ['no es una dirección'],
    ['/'],
    ['https://otro.test/'],
    ['https://adopciones.test.otro.test/'],
    ['https://adopciones.test/animales'],
    ['https://adopciones.test/mis-animales/publicar'],
    ['https://adopciones.test/index'],
  ])('%s no es la portada', (referer) => {
    expect(isHomeReferer(referer, HOST)).toBe(false)
  })

  it('sin host conocido nada es la portada', () => {
    expect(isHomeReferer('https://adopciones.test/', null)).toBe(false)
  })

  it('el host con puerto tiene que coincidir entero', () => {
    expect(isHomeReferer('http://localhost:3000/', 'localhost:3000')).toBe(true)
    expect(isHomeReferer('http://localhost:3001/', 'localhost:3000')).toBe(false)
  })
})

describe('homeViewEvent', () => {
  it('cuenta a una persona, sin propiedades', () => {
    expect(homeViewEvent({ userAgent: BROWSER })).toEqual({ name: 'home_viewed' })
    expect(homeViewEvent({ userAgent: null })).toEqual({ name: 'home_viewed' })
  })

  it('no cuenta a un lector de vista previa', () => {
    expect(homeViewEvent({ userAgent: 'WhatsApp/2.23.20.0 A' })).toBeNull()
    expect(homeViewEvent({ userAgent: 'facebookexternalhit/1.1' })).toBeNull()
  })
})

describe('homePublishTapEvent', () => {
  it('desde la portada del mismo sitio, sin propiedades', () => {
    expect(homePublishTapEvent({ referer: 'https://adopciones.test/', host: HOST })).toEqual({
      name: 'home_publish_tapped',
    })
  })

  it('desde otro lado, o sin referer, nada', () => {
    expect(homePublishTapEvent({ referer: null, host: HOST })).toBeNull()
    expect(homePublishTapEvent({ referer: 'https://otro.test/', host: HOST })).toBeNull()
    expect(
      homePublishTapEvent({ referer: 'https://adopciones.test/mis-animales', host: HOST }),
    ).toBeNull()
  })
})
