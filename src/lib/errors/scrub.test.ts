// Covers: FR-033, spec §Edge Cases «Un aviso con datos adentro». Lo que se cuela en la descripción
// técnica de una falla sale a un tercero: un correo, un teléfono o una cédula ahí es un dato expuesto.
import { describe, expect, it } from 'vitest'
import { scrub } from './scrub'

describe('scrub: lo que parece un dato de una persona sale', () => {
  it.each([
    ['un correo', 'no se pudo mandar a ana.perez+1@correo.com.uy hoy', 'no se pudo mandar a … hoy'],
    ['un celular con espacios', 'número 099 123 456 rechazado', 'número … rechazado'],
    ['un celular con el prefijo del país', 'a +598 99123456 no', 'a … no'],
    ['una cédula con puntos y guion', 'cédula 4.123.456-7 duplicada', 'cédula … duplicada'],
    ['siete dígitos seguidos', 'tel 1234567 fin', 'tel … fin'],
    [
      'un UUID, en minúsculas o mayúsculas',
      'fila 6d1f5f0e-2b7c-4c1a-9e3f-0a1b2c3d4e5f y 6D1F5F0E-2B7C-4C1A-9E3F-0A1B2C3D4E5F',
      'fila … y …',
    ],
    ['un código de ficha', 'ficha 4k2m9x7q1z sin fotos', 'ficha … sin fotos'],
    [
      'el valor de una clave de Postgres',
      'Key (email)=(x@y.uy) already exists',
      'Key (email)=… already exists',
    ],
    ['lo que va entre comillas dobles', 'nombre "Ana Pérez" inválido', 'nombre … inválido'],
    ['lo que va entre comillas simples', "zona 'Pocitos' inválida", 'zona … inválida'],
    ['lo que va entre comillas invertidas', 'texto `hola, soy Ana` largo', 'texto … largo'],
  ])('%s', (_, message, scrubbed) => {
    expect(scrub(message)).toBe(scrubbed)
  })

  it('dos tramos entre comillas en la misma línea salen cada uno, con lo del medio', () => {
    expect(scrub('de "Ana" a "Luis" listo')).toBe('de … a … listo')
  })

  it('seis dígitos no son un teléfono: quedan, como el número de una línea', () => {
    expect(scrub('timeout tras 123456 ms en la línea 42')).toBe(
      'timeout tras 123456 ms en la línea 42',
    )
  })

  it('una palabra de diez letras sin dígitos y fuera del alfabeto de los códigos queda', () => {
    expect(scrub('connection refused')).toBe('connection refused')
  })
})

describe('scrub: forma', () => {
  it('solo la primera línea: el resto suele traer lo que se estaba procesando', () => {
    expect(scrub('fetch failed\nbody: {"nombre":"Ana"}')).toBe('fetch failed')
  })

  it('sin espacios en los bordes', () => {
    expect(scrub('   fetch failed   ')).toBe('fetch failed')
  })

  it('hasta 200 caracteres', () => {
    expect(scrub('a'.repeat(300))).toBe('a'.repeat(200))
    expect(scrub('a'.repeat(200))).toBe('a'.repeat(200))
  })

  it('lo que queda sin ninguna letra sale vacío', () => {
    expect(scrub('ana@correo.com')).toBe('')
    expect(scrub('"Ana Pérez"')).toBe('')
    expect(scrub('   ')).toBe('')
    expect(scrub('')).toBe('')
  })

  it('una sola letra que queda alcanza para que salga', () => {
    expect(scrub('x 099123456')).toBe('x …')
  })
})
