import { describe, expect, it } from 'vitest'
import { initials } from './initials'

const TAB = String.fromCharCode(9)
const NEWLINE = String.fromCharCode(10)

// Covers: US2-AS6, FR-024
describe('las iniciales que se ven cuando no hay foto', () => {
  it('toman la primera letra del nombre y la del apellido', () => {
    expect(initials('Ana García')).toBe('AG')
  })

  it('con un solo nombre, toman una sola letra', () => {
    expect(initials('Ana')).toBe('A')
  })

  it('con tres palabras, toman la primera y la última', () => {
    expect(initials('Ana María García')).toBe('AG')
  })

  it('siempre en mayúscula', () => {
    expect(initials('ana garcía')).toBe('AG')
  })

  it('conservan la tilde de la inicial', () => {
    expect(initials('Ángel Ámbar')).toBe('ÁÁ')
  })

  it('aguantan los espacios de más al principio y al final', () => {
    expect(initials('  Ana García  ')).toBe('AG')
  })

  it('con espacios repetidos en el medio no toman un vacío como palabra', () => {
    expect(initials('Ana     García')).toBe('AG')
  })

  it('separan también con tabulación y con salto de línea', () => {
    expect(initials(`Ana${TAB}García`)).toBe('AG')
    expect(initials(`Ana${NEWLINE}García`)).toBe('AG')
  })

  it('con un solo carácter devuelven ese carácter', () => {
    expect(initials('A')).toBe('A')
  })

  it('con un nombre vacío no devuelven nada, en vez de reventar', () => {
    expect(initials('')).toBe('')
    expect(initials('   ')).toBe('')
  })
})
