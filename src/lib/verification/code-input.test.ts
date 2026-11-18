import { describe, expect, it } from 'vitest'
import { codeToAutoCheck } from './code-input'

// Covers: #308 criterios 1 a 4
describe('el código que se revisa solo', () => {
  it('sale apenas el renglón tiene seis números, escritos o pegados', () => {
    expect(codeToAutoCheck('482017', null)).toBe('482017')
    expect(codeToAutoCheck('482 017', null)).toBe('482017')
    expect(codeToAutoCheck(' 482-017 ', null)).toBe('482017')
  })

  it('con cinco números, más de seis o algo que no es un número, no sale nada', () => {
    expect(codeToAutoCheck('48201', null)).toBeNull()
    expect(codeToAutoCheck('4820171', null)).toBeNull()
    expect(codeToAutoCheck('482 017 1', null)).toBeNull()
    expect(codeToAutoCheck('a482017', null)).toBeNull()
    expect(codeToAutoCheck('48201a', null)).toBeNull()
    expect(codeToAutoCheck('Tu codigo es 482017', null)).toBeNull()
    expect(codeToAutoCheck('', null)).toBeNull()
  })

  it('el mismo código no sale dos veces, aunque se haya escrito distinto', () => {
    expect(codeToAutoCheck('482017', '482017')).toBeNull()
    expect(codeToAutoCheck('482 017', '482017')).toBeNull()
  })

  it('corregido hasta tener seis otra vez, sale', () => {
    expect(codeToAutoCheck('482018', '482017')).toBe('482018')
    expect(codeToAutoCheck('48201', '482017')).toBeNull()
  })
})
