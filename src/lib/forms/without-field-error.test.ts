// Covers: #296 «el aviso de un campo desaparece en cuanto la persona cambia ese campo»
import { describe, expect, it } from 'vitest'
import { withoutFieldError } from './without-field-error'

const LINK = { key: 'pets.errors.contact_web', values: { fragment: 'www.kira.uy' } }
const SIZE = { key: 'pets.errors.size_required' }
const AGE = { key: 'pets.errors.age_required' }

describe('withoutFieldError', () => {
  it('saca solo el aviso del campo cambiado y deja los demás', () => {
    expect(withoutFieldError({ size: SIZE, description: LINK }, 'size')).toStrictEqual({
      description: LINK,
    })
  })

  it('el número y la unidad de la edad sacan el aviso de la edad', () => {
    expect(withoutFieldError({ age: AGE, size: SIZE }, 'ageValue')).toStrictEqual({ size: SIZE })
    expect(withoutFieldError({ age: AGE, size: SIZE }, 'ageUnit')).toStrictEqual({ size: SIZE })
  })

  it('un campo sin aviso devuelve el mismo objeto', () => {
    const errors = { description: LINK }
    expect(withoutFieldError(errors, 'isUrgent')).toBe(errors)
    expect(withoutFieldError(errors, 'ageValue')).toBe(errors)
  })
})
