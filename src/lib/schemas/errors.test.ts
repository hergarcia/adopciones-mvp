// Covers: FR-033, research R10 vía 4. La acción que avisa una falla del navegador es pública: el
// schema es lo único que impide meter texto libre —o lo que escribió una persona— en el registro.
import { describe, expect, it } from 'vitest'
import { clientFailureSchema } from './errors'

const valid = { path: '/animales/AB', name: 'TypeError' }

function passes(input: unknown): boolean {
  return clientFailureSchema.safeParse(input).success
}

describe('clientFailureSchema', () => {
  it('una ruta y el nombre de un error pasan, tal cual', () => {
    expect(clientFailureSchema.parse(valid)).toEqual(valid)
  })

  it('la ruta empieza con / y tiene hasta 200 caracteres', () => {
    expect(passes({ ...valid, path: '/' })).toBe(true)
    expect(passes({ ...valid, path: `/${'a'.repeat(199)}` })).toBe(true)
    expect(passes({ ...valid, path: `/${'a'.repeat(200)}` })).toBe(false)
    expect(passes({ ...valid, path: 'animales/AB' })).toBe(false)
    expect(passes({ ...valid, path: '' })).toBe(false)
  })

  it('la ruta no lleva espacios ni saltos de línea', () => {
    expect(passes({ ...valid, path: '/animales/AB\nhola' })).toBe(false)
    expect(passes({ ...valid, path: '/animales/AB hola' })).toBe(false)
  })

  it('el nombre son solo letras, hasta 40', () => {
    expect(passes({ ...valid, name: 'a'.repeat(40) })).toBe(true)
    expect(passes({ ...valid, name: 'a'.repeat(41) })).toBe(false)
    expect(passes({ ...valid, name: 'Type Error' })).toBe(false)
    expect(passes({ ...valid, name: 'Error2' })).toBe(false)
    expect(passes({ ...valid, name: '<b>' })).toBe(false)
    expect(passes({ ...valid, name: '' })).toBe(false)
    expect(passes({ ...valid, name: 'Error<' })).toBe(false)
    expect(passes({ ...valid, name: '<Error' })).toBe(false)
  })

  it('nada más: ni el mensaje del error ni otro campo', () => {
    expect(passes({ ...valid, message: 'Ana escribió esto' })).toBe(false)
    expect(passes({ path: '/animales/AB' })).toBe(false)
    expect(passes({ name: 'TypeError' })).toBe(false)
  })
})
