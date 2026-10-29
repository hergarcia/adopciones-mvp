// Covers: US3-AS1, US3-AS2, US3-AS3, US3-AS4, US3-AS5, FR-023, FR-024 (research R11)
import { describe, expect, it } from 'vitest'
import { petViewOrigin, visitMarks } from './visit-origin'

const HOST = 'adopciones.test'
const visit = { mark: null, referer: null, host: HOST, utmSource: null }
const PROFILE = 'https://adopciones.test/perfil/SemillaCarla0000000005'

describe('petViewOrigin', () => {
  it('con una marca, su origen gana: «compartido» o «respuesta», venga de donde venga', () => {
    for (const referer of [
      null,
      'https://l.facebook.com/l.php?u=x',
      'https://adopciones.test/animales',
      PROFILE,
      'https://www.google.com/',
    ]) {
      expect(petViewOrigin({ ...visit, mark: 'shared', referer })).toBe('shared')
      expect(petViewOrigin({ ...visit, mark: 'reply', referer })).toBe('reply')
      expect(petViewOrigin({ ...visit, mark: 'alert', referer })).toBe('alert')
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

  // Covers: US3-AS4, FR-018 (#238, research R6). Si una visita del sitio cuenta como «desde un
  // perfil», la beta cree que el perfil del rescatista funciona como vidriera cuando no.
  it.each([
    [PROFILE, 'profile'],
    [`${PROFILE}?mostrar=48`, 'profile'],
    ['https://adopciones.test/perfil/a-b_c-d_e-f_g-h_i-j_kl', 'profile'],
    ['https://adopciones.test/perfil/corto', 'site'],
    ['https://adopciones.test/perfil/SemillaCarla00000000051', 'site'],
    ['https://adopciones.test/perfil', 'site'],
    [`${PROFILE}/foto`, 'site'],
    [`${PROFILE}/`, 'site'],
    ['https://adopciones.test/perfiles/SemillaCarla0000000005', 'site'],
    ['https://adopciones.test/animales/SemillaCarla0000000005', 'site'],
    ['https://otro.test/perfil/SemillaCarla0000000005', 'unknown'],
  ])('desde %s es %s', (referer, origin) => {
    expect(petViewOrigin({ ...visit, referer })).toBe(origin)
  })

  // Covers: historia #259, criterio 5. Si la dirección del sugerido pegada en otro lado cuenta como
  // sugerido, la beta cree que quien no fue elegido vuelve a pedir acá cuando no lo hace.
  it('la marca del sugerido vale navegando el sitio, venga de la pantalla que venga', () => {
    for (const referer of [
      'https://adopciones.test/mis-solicitudes/0b8c3c1e-0000-4000-8000-000000000000',
      'https://adopciones.test/animales',
    ])
      expect(petViewOrigin({ ...visit, mark: 'suggested', referer })).toBe('suggested')
  })

  it.each([
    [null, 'unknown'],
    ['https://l.facebook.com/l.php?u=x', 'social'],
    ['https://otro.test/mis-solicitudes/x', 'unknown'],
  ])('la marca del sugerido desde %s no cuenta: es %s', (referer, origin) => {
    expect(petViewOrigin({ ...visit, mark: 'suggested', referer })).toBe(origin)
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
    expect(visitMarks({ desde: 'compartir' }).mark).toBe('shared')
    expect(visitMarks({ desde: 'otra' }).mark).toBeNull()
    expect(visitMarks({ desde: 'resumen' }).mark).toBeNull()
    expect(visitMarks({ desde: ['compartir', 'compartir'] }).mark).toBeNull()
    expect(visitMarks({}).mark).toBeNull()
  })

  // Covers: #250, la respuesta para quien escribe se cuenta aparte del «enlace compartido».
  it('?desde=respuesta es la marca de la respuesta; repetida o con otra forma, no', () => {
    expect(visitMarks({ desde: 'respuesta' }).mark).toBe('reply')
    expect(visitMarks({ desde: ['respuesta'] }).mark).toBeNull()
    expect(visitMarks({ desde: 'Respuesta' }).mark).toBeNull()
  })

  // Covers: historia #259, criterio 5
  it('?desde=sugerido es la marca del sugerido; repetida o con otra forma, no', () => {
    expect(visitMarks({ desde: 'sugerido' }).mark).toBe('suggested')
    expect(visitMarks({ desde: ['sugerido'] }).mark).toBeNull()
    expect(visitMarks({ desde: 'Sugerido' }).mark).toBeNull()
  })

  // Covers: FR-039 de la #265, la ficha abierta desde el correo de avisos se cuenta con su origen.
  it('?desde=aviso es la marca del correo de avisos; repetida o con otra forma, no', () => {
    expect(visitMarks({ desde: 'aviso' }).mark).toBe('alert')
    expect(visitMarks({ desde: ['aviso'] }).mark).toBeNull()
    expect(visitMarks({ desde: 'Aviso' }).mark).toBeNull()
  })

  it('el utm_source pasa solo cuando viene uno', () => {
    expect(visitMarks({ utm_source: 'chatgpt.com' }).utmSource).toBe('chatgpt.com')
    expect(visitMarks({ utm_source: ['chatgpt.com', 'x'] }).utmSource).toBeNull()
    expect(visitMarks({}).utmSource).toBeNull()
  })
})
