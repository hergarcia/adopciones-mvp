// Covers: US2-AS1 (la ficha como pantalla) y el Edge Case «La pantalla de una opinión»: lo público
// con lo que mostraba, lo privado solo con su nombre
import { describe, expect, it } from 'vitest'
import { feedbackOrigin, feedbackPlace, feedbackScreen } from './screens'

describe('feedbackScreen: pantallas públicas', () => {
  it.each([
    ['/', 'home'],
    ['/animales', 'listing'],
    ['/niveles', 'levels'],
  ])('%s → %s, sin sujeto', (path, screen) => {
    expect(feedbackScreen(path)).toEqual({ screen, subject: null })
  })

  it('la ficha guarda el código del animal', () => {
    expect(feedbackScreen('/animales/luna-4k2')).toEqual({ screen: 'pet', subject: 'luna-4k2' })
  })

  it('el perfil público guarda su id', () => {
    expect(feedbackScreen('/perfil/a1_b2')).toEqual({ screen: 'profile', subject: 'a1_b2' })
  })

  it('un sujeto que no es un código queda afuera', () => {
    expect(feedbackScreen('/animales/luna%20y%20tobi')).toEqual({ screen: 'pet', subject: null })
    expect(feedbackScreen(`/perfil/${'a'.repeat(65)}`)).toEqual({
      screen: 'profile',
      subject: null,
    })
    expect(feedbackScreen(`/perfil/${'a'.repeat(64)}`).subject).toBe('a'.repeat(64))
    expect(feedbackScreen('/perfil')).toEqual({ screen: 'profile', subject: null })
  })

  it('sin el prefijo de idioma, sin la búsqueda ni el ancla', () => {
    expect(feedbackScreen('/es/animales/luna?foto=2#arriba')).toEqual({
      screen: 'pet',
      subject: 'luna',
    })
    expect(feedbackScreen('/es')).toEqual({ screen: 'home', subject: null })
    expect(feedbackScreen('/animales?especie=perro')).toEqual({ screen: 'listing', subject: null })
    expect(feedbackScreen('/#arriba')).toEqual({ screen: 'home', subject: null })
    expect(feedbackScreen('/animales/luna?nota=a\nb')).toEqual({ screen: 'pet', subject: 'luna' })
  })

  it('el idioma es solo el primer segmento entero', () => {
    expect(feedbackScreen('/esniveles')).toEqual({ screen: 'other', subject: null })
    expect(feedbackScreen('/animales/es')).toEqual({ screen: 'pet', subject: 'es' })
  })

  it('una ruta más honda que la ficha o el perfil no es pública', () => {
    expect(feedbackScreen('/animales/luna/fotos')).toEqual({ screen: 'other', subject: null })
    expect(feedbackScreen('/perfil/a1/avales')).toEqual({ screen: 'other', subject: null })
    expect(feedbackScreen('/niveles/uno')).toEqual({ screen: 'other', subject: null })
  })
})

describe('feedbackScreen: pantallas privadas, solo el nombre', () => {
  it.each([
    ['/mis-animales', 'my_pets'],
    ['/mis-animales/6d1f5f0e/adoptado', 'my_pets'],
    ['/mis-solicitudes', 'my_applications'],
    ['/mis-solicitudes/6d1f5f0e', 'my_application'],
    ['/solicitudes/animal/6d1f5f0e', 'publisher_applications'],
    ['/mi-perfil/editar', 'my_profile'],
    ['/verificar-identidad', 'verification'],
    ['/verificar-telefono/codigo', 'verification'],
    ['/revision/6d1f5f0e', 'review'],
    ['/entrar/revisa-tu-correo', 'sign_in'],
    ['/completar-perfil', 'sign_in'],
    ['/cuenta-suspendida', 'suspended'],
    ['/es/mis-animales', 'my_pets'],
  ])('%s → %s', (path, screen) => {
    expect(feedbackScreen(path)).toEqual({ screen, subject: null })
  })

  it.each(['/solicitar/luna', '/cuenta-borrada', '/constructor', '/toString'])(
    '%s → other',
    (path) => {
      expect(feedbackScreen(path)).toEqual({ screen: 'other', subject: null })
    },
  )
})

describe('feedbackPlace', () => {
  it('sin origen, otra pantalla y no la portada', () => {
    expect(feedbackPlace(null)).toEqual({ screen: 'other', subject: null })
    expect(feedbackPlace('')).toEqual({ screen: 'other', subject: null })
  })

  it('con origen, la pantalla de esa ruta', () => {
    expect(feedbackPlace('/')).toEqual({ screen: 'home', subject: null })
    expect(feedbackPlace('/animales/luna')).toEqual({ screen: 'pet', subject: 'luna' })
  })
})

describe('feedbackOrigin', () => {
  const host = 'adopciones.test'

  it('la ruta de una pantalla de este sitio, sin la búsqueda', () => {
    expect(feedbackOrigin('https://adopciones.test/animales/luna?foto=2', host)).toBe(
      '/animales/luna',
    )
  })

  it('nada sin Referer, sin host, de otro sitio, ilegible o desde Opinar', () => {
    expect(feedbackOrigin(null, host)).toBeNull()
    expect(feedbackOrigin('https://adopciones.test/animales', null)).toBeNull()
    expect(feedbackOrigin('https://otro.test/animales/luna', host)).toBeNull()
    expect(feedbackOrigin('no es una dirección', host)).toBeNull()
    expect(feedbackOrigin('https://adopciones.test/opinar', host)).toBeNull()
  })
})
