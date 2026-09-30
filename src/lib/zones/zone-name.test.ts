import { describe, expect, it } from 'vitest'
import { zoneName } from './zone-name'

describe('el nombre de una zona', () => {
  it('lleva la localidad y el departamento', () => {
    expect(zoneName({ department: 'UY-MO', locality: 'Pocitos' })).toBe('Pocitos, Montevideo')
  })

  it('nombra una sola vez la localidad que se llama como su departamento', () => {
    expect(zoneName({ department: 'UY-SA', locality: 'Salto' })).toBe('Salto')
  })

  // Quien escribe en un teléfono no pone mayúsculas ni tildes.
  it('reconoce la capital escrita sin mayúscula ni tilde', () => {
    expect(zoneName({ department: 'UY-SA', locality: 'salto' })).toBe('Salto')
    expect(zoneName({ department: 'UY-PA', locality: 'Paysandu' })).toBe('Paysandú')
  })

  it('no confunde una localidad que solo empieza como el departamento', () => {
    expect(zoneName({ department: 'UY-SA', locality: 'Salto Grande' })).toBe('Salto Grande, Salto')
  })
})
