import { describe, expect, it } from 'vitest'
import { DEFAULT_DESTINATION, safeDestination, signInRetryPath } from './next-destination'

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
