import { describe, expect, it } from 'vitest'
import { profileViewOrigin, shouldTrackView, viewOrigin } from './view-origin'

const SITE = 'https://sitio.com'
const BROWSER = 'Mozilla/5.0 (Linux; Android 14) Chrome/129.0 Mobile Safari/537.36'

// Covers: FR-028, SC-007. Si «desde el sitio» se cuenta como «desde un enlace», la señal de la beta
// dice que la gente comparte el perfil cuando no lo hace.
describe('de dónde llega una vista', () => {
  it('del mismo sitio, navegando', () => {
    expect(viewOrigin('https://sitio.com/perfil/abc', SITE)).toBe('site')
    expect(viewOrigin('https://sitio.com/', 'https://sitio.com/otra')).toBe('site')
  })

  it.each([
    ['sin Referer', null],
    ['un Referer vacío', ''],
    ['otro sitio', 'https://otro.com/perfil'],
    ['un sitio que empieza igual', 'https://sitio.com.evil/perfil'],
    ['otro puerto', 'https://sitio.com:8443/perfil'],
    ['otro esquema', 'http://sitio.com/perfil'],
    ['algo que no es una URL', 'no es una url'],
  ])('%s es un enlace', (_caso, referer) => {
    expect(viewOrigin(referer, SITE)).toBe('link')
  })
})

// Covers: US3-AS1, US3-AS2, US3-AS3, US3-AS4, FR-010, FR-011, SC-004. Si la dirección pegada en
// WhatsApp cuenta como «desde una solicitud», la beta cree que quien rescata mira quién responde por
// la persona cuando no lo hace.
describe('de dónde llega una vista al perfil', () => {
  it('con la marca de la solicitud y navegando el sitio, desde una solicitud', () => {
    expect(profileViewOrigin('https://sitio.com/solicitudes/abc', SITE, true)).toBe('application')
  })

  it.each([
    ['sin Referer', null],
    ['un Referer vacío', ''],
    ['otro sitio', 'https://otro.com/solicitudes/abc'],
    ['un sitio que empieza igual', 'https://sitio.com.evil/solicitudes/abc'],
  ])('con la marca y %s, un enlace', (_caso, referer) => {
    expect(profileViewOrigin(referer, SITE, true)).toBe('link')
  })

  it('sin la marca, como cualquier otra vista', () => {
    expect(profileViewOrigin('https://sitio.com/animales/abc', SITE, false)).toBe('site')
    expect(profileViewOrigin('https://otro.com/', SITE, false)).toBe('link')
    expect(profileViewOrigin(null, SITE, false)).toBe('link')
  })
})

describe('qué vista se registra', () => {
  it('la de otra persona, desde un navegador', () => {
    expect(shouldTrackView({ isOwner: false, userAgent: BROWSER, hasActionFlag: false })).toBe(true)
    expect(shouldTrackView({ isOwner: false, userAgent: null, hasActionFlag: false })).toBe(true)
  })

  it('no la de la dueña', () => {
    expect(shouldTrackView({ isOwner: true, userAgent: BROWSER, hasActionFlag: false })).toBe(false)
  })

  it('no la de una vista previa', () => {
    expect(
      shouldTrackView({ isOwner: false, userAgent: 'WhatsApp/2.23', hasActionFlag: false }),
    ).toBe(false)
  })

  it('no la de quien vuelve de avalar o retirar', () => {
    expect(shouldTrackView({ isOwner: false, userAgent: BROWSER, hasActionFlag: true })).toBe(false)
  })
})
