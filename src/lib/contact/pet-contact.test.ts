// Covers: US1-AS7, US2-AS6, FR-011, FR-014 y los Edge Cases «Números que no son teléfonos» y «Vía
// de contacto en el nombre o en la localidad».
import { describe, expect, it } from 'vitest'
import { hasStreetNumber, petContactMatch } from './pet-contact'

describe('petContactMatch frena', () => {
  it.each([
    ['celular con espacios', 'Llamame al 099 123 456 cuando quieras', '099 123 456'],
    ['celular sin el 0', 'Escribime 99 123 456', '99 123 456'],
    ['celular pegado', 'Tel 099123456', '099123456'],
    ['con puntos', 'Es 099.123.456 o nada', '099.123.456'],
    ['con guiones', 'Es 099-123-456', '099-123-456'],
    ['con guiones y espacios', 'Es 099 - 123 - 456', '099 - 123 - 456'],
    ['con espacios dobles', 'Es 099  123  456', '099  123  456'],
    ['con prefijo', 'Desde afuera +598 99.123.456', '+598 99.123.456'],
    ['fijo de 8', 'Fijo 2901 2345, de tarde', '2901 2345'],
    ['años solo con espacios', 'Rescatada entre 2023 2024', '2023 2024'],
    ['número de chip', 'Chip 858000012345678', '858000012345678'],
  ])('un teléfono: %s', (_caso, text, fragment) => {
    expect(petContactMatch(text)).toEqual({ kind: 'phone', fragment })
  })

  it.each([
    ['un correo', 'Escribí a ana@gmail.com y te cuento', 'email', 'ana@gmail.com'],
    [
      'un correo al final de la oración',
      'Mi correo: luna.rescate@hotmail.com.',
      'email',
      'luna.rescate@hotmail.com',
    ],
    ['http sin s', 'Mirá http://rescate.example', 'web', 'http://rescate.example'],
    ['http', 'Mirá https://rescate.example/luna', 'web', 'https://rescate.example/luna'],
    ['www', 'En www.rescate.example', 'web', 'www.rescate.example'],
    ['un dominio con barra', 'Seguila en instagram.com/luna', 'web', 'instagram.com/luna'],
    ['un dominio al final', 'Estamos en fb.com', 'web', 'fb.com'],
    ['un dominio con otro punto', 'Ver rescate.org.uy hoy', 'web', 'rescate.org.uy'],
    ['un dominio .net', 'Ver huellas.net', 'web', 'huellas.net'],
    ['un dominio .uy en mayúsculas', 'Ver HUELLAS.UY', 'web', 'HUELLAS.UY'],
    ['un dominio seguido de coma', 'En fb.com, o donde sea', 'web', 'fb.com'],
    ['wa.me', 'Escribime por wa.me', 'web', 'wa.me'],
    ['wa.me con número', 'wa.me/59899123456', 'web', 'wa.me/59899123456'],
    ['t.me', 'Por t.me/luna', 'web', 't.me/luna'],
    ['bit.ly', 'bit.ly/abc', 'web', 'bit.ly/abc'],
    ['tinyurl.com', 'tinyurl.com/abc', 'web', 'tinyurl.com/abc'],
    ['linktr.ee', 'Todo en linktr.ee/luna', 'web', 'linktr.ee/luna'],
    ['un usuario', 'Seguinos en @luna.rescate', 'social', '@luna.rescate'],
    ['un usuario con guion bajo', '@_luna', 'social', '@_luna'],
    ['un usuario entre paréntesis', 'Nuestra cuenta (@luna)', 'social', '@luna'],
    ['un usuario entre dos paréntesis', 'Nuestra cuenta ((@luna))', 'social', '@luna'],
    [
      'un enlace con paréntesis adentro',
      'linktr.ee/luna(rescate)',
      'web',
      'linktr.ee/luna(rescate',
    ],
    ['un dominio con signos al final', 'Mirá fb.com!!', 'web', 'fb.com'],
  ])('%s', (_caso, text, kind, fragment) => {
    expect(petContactMatch(text)).toEqual({ kind, fragment })
  })

  it('cita el que aparece primero', () => {
    expect(petContactMatch('099 123 456 o ana@gmail.com')).toEqual({
      kind: 'phone',
      fragment: '099 123 456',
    })
    expect(petContactMatch('ana@gmail.com o 099 123 456')).toEqual({
      kind: 'email',
      fragment: 'ana@gmail.com',
    })
    expect(petContactMatch('@luna o fb.com')).toEqual({ kind: 'social', fragment: '@luna' })
    expect(petContactMatch('fb.com o @luna')).toEqual({ kind: 'web', fragment: 'fb.com' })
  })

  it('un teléfono al lado de una fecha sigue siendo un teléfono', () => {
    expect(petContactMatch('Desde el 12.03.2025, tel 099123456')).toEqual({
      kind: 'phone',
      fragment: '099123456',
    })
  })
})

describe('petContactMatch deja pasar', () => {
  it.each([
    ['una fecha con puntos', 'Llegó el 12.03.2025'],
    ['una fecha con espacios', 'Llegó el 12 03 2025'],
    ['una fecha con barras', 'Llegó el 12/03/2025'],
    ['una fecha con guiones', 'Llegó el 1-3-2025'],
    ['una fecha del siglo pasado', 'Nació el 31.12.1999'],
    ['una fecha con espacios dobles', 'Llegó el 12  03  2025'],
    ['una fecha con espacios alrededor de los puntos', 'Llegó el 12 . 03 . 2025'],
    ['dos fechas de un dígito seguidas', 'Vacunas: 5.3.2025 10.4.2025'],
    ['una fecha de un dígito seguida de un número', 'Castrada el 5.3.2025 15 días después'],
    ['una ruta y un kilómetro', 'La encontramos en Ruta 8 km 25'],
    ['un peso', 'Pesa 12,5 kg y come 300 g'],
    ['años con coma', 'Rescatada entre 2023, 2024'],
    ['siete dígitos', 'Código 1234567'],
    ['un punto sin espacio antes de una palabra', 'Está castrada.Come de todo'],
    ['otro', 'Es muy buena.Como un peluche'],
    ['una arroba suelta', 'Juega @ toda hora'],
    ['un correo disfrazado', 'juan arroba gmail punto com'],
    ['un texto común', 'Luna es tranquila, le gustan los gatos y los niños.'],
    ['vacío', ''],
  ])('%s', (_caso, text) => {
    expect(petContactMatch(text)).toBeNull()
  })

  it('una fecha que no es fecha no se tapa', () => {
    expect(petContactMatch('32.03.2025')?.kind).toBe('phone')
    expect(petContactMatch('12.13.2025')?.kind).toBe('phone')
    expect(petContactMatch('12.03.1825')?.kind).toBe('phone')
    expect(petContactMatch('112.03.2025')?.kind).toBe('phone')
    expect(petContactMatch('12.03.20251')?.kind).toBe('phone')
  })
})

describe('hasStreetNumber', () => {
  it.each([
    ['Av. Italia 3456', true],
    ['Calle 123', true],
    ['Villa 25 de Agosto', false],
    ['Km 16', false],
    ['Pocitos', false],
  ])('%s → %s', (text, expected) => {
    expect(hasStreetNumber(text)).toBe(expected)
  })
})
