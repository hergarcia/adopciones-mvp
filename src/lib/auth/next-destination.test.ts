import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DESTINATION,
  carriedDestination,
  checkEmailPath,
  safeDestination,
  signInPath,
  signInRetryPath,
  signInWithNext,
} from './next-destination'

// Covers: US1-AS12, FR-014, FR-014a. Si esto se rompe, un enlace que llegó por correo puede
// mandar a la persona fuera del sitio: es un redirect abierto, no un detalle de navegación.
describe('a dónde se vuelve después de ingresar', () => {
  it('sin destino válido, el aterrizaje es el perfil', () => {
    expect(DEFAULT_DESTINATION).toBe('/mi-perfil')
  })

  it('a una ruta de este sitio', () => {
    expect(safeDestination('/mi-perfil/editar')).toBe('/mi-perfil/editar')
  })

  it('conserva los parámetros de la ruta', () => {
    expect(safeDestination('/animales?especie=perro')).toBe('/animales?especie=perro')
  })

  it.each([
    ['sin destino', null],
    ['vacío', ''],
    ['indefinido', undefined],
  ])('sin destino %s, al perfil', (_caso, value) => {
    expect(safeDestination(value)).toBe(DEFAULT_DESTINATION)
  })

  it.each([
    ['una URL entera', 'https://otro.com/phishing'],
    ['sin esquema pero con host', '//otro.com/phishing'],
    ['con contrabarra, que algunos navegadores siguen igual', '/\\otro.com'],
    ['una ruta relativa', 'mi-perfil'],
    ['un esquema raro', 'javascript:alert(1)'],
    ['un salto de línea, que parte la respuesta', '/mi-perfil\nLocation: https://otro.com'],
    ['un nulo', `/mi-perfil${String.fromCharCode(0)}`],
  ])('descarta %s y manda al perfil', (_caso, value) => {
    expect(safeDestination(value)).toBe(DEFAULT_DESTINATION)
  })
})

// Covers: FR-010, FR-013. Un intento con Google que falla no puede hacer perder el destino, y lo
// que vuelve en la URL pasa por el mismo filtro que todo destino.
describe('la vuelta a /entrar después de un intento fallido con Google', () => {
  it('sin destino, solo el motivo', () => {
    expect(signInRetryPath('google-cancelado', null)).toBe('/entrar?motivo=google-cancelado')
    expect(signInRetryPath('google-cancelado', undefined)).toBe('/entrar?motivo=google-cancelado')
  })

  it('con destino, lo conserva', () => {
    expect(signInRetryPath('google-sin-verificar', '/mi-perfil/editar')).toBe(
      '/entrar?motivo=google-sin-verificar&next=%2Fmi-perfil%2Feditar',
    )
  })

  it('un destino fuera del sitio no sobrevive a la vuelta', () => {
    expect(signInRetryPath('google-cancelado', '//otro.com')).toBe(
      '/entrar?motivo=google-cancelado&next=%2Fmi-perfil',
    )
  })
})

// Covers: FR-008. «Entrar de nuevo» tiene que volver a la
// misma pantalla, con su consulta entera: si la ruta no va codificada, su `&` se lee como otro
// parámetro de /entrar y la vuelta llega a medias.
describe('entrar con la vuelta a una pantalla', () => {
  it('lleva la ruta entera, codificada, como destino', () => {
    expect(signInWithNext('/verificar-telefono?para=publicar&next=/publicar')).toBe(
      '/entrar?next=%2Fverificar-telefono%3Fpara%3Dpublicar%26next%3D%2Fpublicar',
    )
  })
})

const PUBLISH = '/mis-animales/publicar'

// Covers: FR-001, FR-006, US1-AS3, US1-AS9. Lo que se arrastra de una pantalla a otra después de un
// enlace que no sirvió: si deja pasar un destino de otro sitio, el enlace nuevo es un redirect
// abierto; si pierde uno válido, la persona termina en Mi perfil en vez de a donde iba.
describe('el destino que viaja después de un enlace que no sirvió', () => {
  it('un destino del sitio viaja tal cual, con su consulta', () => {
    expect(carriedDestination(PUBLISH)).toBe(PUBLISH)
    expect(carriedDestination('/animales?especie=perro')).toBe('/animales?especie=perro')
  })

  it.each([
    ['sin destino', null],
    ['vacío', ''],
    ['indefinido', undefined],
    ['Mi perfil, que es a donde se llega sin destino', DEFAULT_DESTINATION],
    ['una URL entera', 'https://otro.com'],
    ['sin esquema pero con host', '//otro.com'],
    ['con contrabarra', '/\\otro.com'],
    ['una ruta relativa', 'mis-animales/publicar'],
    ['un salto de línea', `${PUBLISH}\nLocation: https://otro.com`],
  ])('%s no viaja', (_caso, value) => {
    expect(carriedDestination(value)).toBeNull()
  })
})

// Covers: FR-003, FR-004, FR-006. Las dos pantallas de ingreso a las que se vuelve: sin destino,
// la misma URL de hoy; con destino, codificado para que su consulta no se lea como de la pantalla.
describe('a qué pantalla de ingreso se vuelve con el destino', () => {
  it('«Escribir mi correo» sin destino va a entrar a secas', () => {
    expect(signInPath(null)).toBe('/entrar')
  })

  it('«Escribir mi correo» con destino lo lleva codificado', () => {
    expect(signInPath('/animales?especie=perro&orden=nuevo')).toBe(
      '/entrar?next=%2Fanimales%3Fespecie%3Dperro%26orden%3Dnuevo',
    )
  })

  it('«Revisá tu correo» sin destino queda como hoy', () => {
    expect(checkEmailPath(null)).toBe('/entrar/revisa-tu-correo')
  })

  it('«Revisá tu correo» con destino lo lleva codificado', () => {
    expect(checkEmailPath('/animales?especie=perro&orden=nuevo')).toBe(
      '/entrar/revisa-tu-correo?next=%2Fanimales%3Fespecie%3Dperro%26orden%3Dnuevo',
    )
  })
})
