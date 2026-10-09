// Covers: US1-AS7, US2-AS6, FR-011, FR-014 y los Edge Cases «Números que no son teléfonos» y «Vía
// de contacto en el nombre o en la localidad».
import { describe, expect, it } from 'vitest'
import { CONTACT_CASES, PASSING_CASES, STREET_NUMBER_CASES } from './contact-cases'
import { contactMatch, hasStreetNumber, phoneOrEmailMatch } from './contact-match'

describe('contactMatch frena', () => {
  it.each(CONTACT_CASES)('%s', (_caso, text, kind, fragment) => {
    expect(contactMatch(text)).toEqual({ kind, fragment })
  })

  it('cita el que aparece primero', () => {
    expect(contactMatch('099 123 456 o ana@gmail.com')).toEqual({
      kind: 'phone',
      fragment: '099 123 456',
    })
    expect(contactMatch('ana@gmail.com o 099 123 456')).toEqual({
      kind: 'email',
      fragment: 'ana@gmail.com',
    })
    expect(contactMatch('@luna o fb.com')).toEqual({ kind: 'social', fragment: '@luna' })
    expect(contactMatch('fb.com o @luna')).toEqual({ kind: 'web', fragment: 'fb.com' })
  })

  it('un teléfono al lado de una fecha sigue siendo un teléfono', () => {
    expect(contactMatch('Desde el 12.03.2025, tel 099123456')).toEqual({
      kind: 'phone',
      fragment: '099123456',
    })
  })
})

describe('contactMatch deja pasar', () => {
  it.each(PASSING_CASES)('%s', (_caso, text) => {
    expect(contactMatch(text)).toBeNull()
  })

  it('una fecha que no es fecha no se tapa', () => {
    expect(contactMatch('32.03.2025')?.kind).toBe('phone')
    expect(contactMatch('12.13.2025')?.kind).toBe('phone')
    expect(contactMatch('12.03.1825')?.kind).toBe('phone')
    expect(contactMatch('112.03.2025')?.kind).toBe('phone')
    expect(contactMatch('12.03.20251')?.kind).toBe('phone')
  })
})

// Covers: US1-AS13, US2-AS6 de la historia #71 (solo un teléfono o un correo)
describe('phoneOrEmailMatch', () => {
  it('frena un teléfono y un correo, el primero que aparece', () => {
    expect(phoneOrEmailMatch('llamame al 099 123 456')).toEqual({
      kind: 'phone',
      fragment: '099 123 456',
    })
    expect(phoneOrEmailMatch('ana@gmail.com o 099 123 456')).toEqual({
      kind: 'email',
      fragment: 'ana@gmail.com',
    })
    expect(phoneOrEmailMatch('099 123 456 o ana@gmail.com')).toEqual({
      kind: 'phone',
      fragment: '099 123 456',
    })
  })

  it('deja pasar un enlace y un usuario de redes, y sigue buscando detrás', () => {
    expect(phoneOrEmailMatch('vi el post en instagram.com/luna, @refugio')).toBeNull()
    expect(phoneOrEmailMatch('fb.com/grupo o 099123456')).toEqual({
      kind: 'phone',
      fragment: '099123456',
    })
  })

  it('un número que no es un teléfono pasa', () => {
    expect(phoneOrEmailMatch('500 caracteres, 2 años, en 2024')).toBeNull()
  })
})

describe('hasStreetNumber', () => {
  it.each(STREET_NUMBER_CASES)('%s → %s', (text, expected) => {
    expect(hasStreetNumber(text)).toBe(expected)
  })
})
