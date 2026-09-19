import { describe, expect, it } from 'vitest'
import {
  contactKind,
  LOCALITY_MAX,
  NAME_MAX,
  NAME_MIN,
  validateProfile,
  profileSchema,
} from './profile'

function profile(overrides: Record<string, unknown> = {}) {
  return {
    displayName: 'Ana García',
    department: 'UY-MO',
    locality: 'Pocitos',
    isRescuer: false,
    ...overrides,
  }
}

function errorOf(input: Record<string, unknown>): string | undefined {
  return profileSchema.safeParse(input).error?.issues[0]?.message
}

// Covers: US2-AS1, US2-AS4, FR-016, FR-018, FR-020, FR-020a
describe('el perfil que se puede guardar', () => {
  it('acepta lo mínimo: nombre, departamento y localidad', () => {
    expect(profileSchema.safeParse(profile()).success).toBe(true)
  })

  it('limpia los espacios de más, que no son un error de la persona', () => {
    const result = profileSchema.safeParse(profile({ displayName: '  Ana   García  ' }))
    expect(result.data?.displayName).toBe('Ana García')
  })

  it.each([
    ['vacío', '', 'profile.errors.name_required'],
    ['solo espacios', '   ', 'profile.errors.name_required'],
    ['de una sola letra', 'A', 'profile.errors.name_too_short'],
  ])('rechaza un nombre %s', (_caso, displayName, expected) => {
    expect(errorOf(profile({ displayName }))).toBe(expected)
  })

  it('acepta un nombre de exactamente el mínimo', () => {
    expect(profileSchema.safeParse(profile({ displayName: 'A'.repeat(NAME_MIN) })).success).toBe(
      true,
    )
  })

  it('acepta un nombre de exactamente el máximo', () => {
    expect(profileSchema.safeParse(profile({ displayName: 'A'.repeat(NAME_MAX) })).success).toBe(
      true,
    )
  })

  it('rechaza un nombre de un carácter más que el máximo', () => {
    expect(errorOf(profile({ displayName: 'A'.repeat(NAME_MAX + 1) }))).toBe(
      'profile.errors.name_too_long',
    )
  })

  it('rechaza una localidad vacía', () => {
    expect(errorOf(profile({ locality: '  ' }))).toBe('profile.errors.locality_required')
  })

  it('acepta una localidad de exactamente el máximo', () => {
    expect(profileSchema.safeParse(profile({ locality: 'a'.repeat(LOCALITY_MAX) })).success).toBe(
      true,
    )
  })

  it('rechaza una localidad de un carácter más que el máximo', () => {
    expect(errorOf(profile({ locality: 'a'.repeat(LOCALITY_MAX + 1) }))).toBe(
      'profile.errors.locality_too_long',
    )
  })

  it.each([
    ['uno que no existe', 'UY-XX'],
    ['el nombre en vez del código', 'Montevideo'],
    ['vacío', ''],
  ])('rechaza un departamento %s', (_caso, department) => {
    expect(errorOf(profile({ department }))).toBe('profile.errors.department_required')
  })

  it('acepta los diecinueve departamentos', () => {
    const codes = ['UY-AR', 'UY-CA', 'UY-MO', 'UY-TT', 'UY-RN']
    for (const department of codes) {
      expect(profileSchema.safeParse(profile({ department })).success).toBe(true)
    }
  })

  it('la marca de rescatista es sí o no, no una elección entre dos cosas', () => {
    expect(profileSchema.safeParse(profile({ isRescuer: true })).success).toBe(true)
    expect(profileSchema.safeParse(profile({ isRescuer: 'refugio' })).success).toBe(false)
  })
})

// Covers: FR-020b. Estos dos campos se vuelven públicos en la historia #12, y el contacto fuera
// de una solicitud aceptada es justamente lo que este producto no hace.
describe('nada de vías de contacto en el nombre ni en la localidad', () => {
  it.each([
    ['un correo', 'Ana ana@ejemplo.com', 'email'],
    ['una dirección web', 'Ana www.ana.com', 'web'],
    ['una dirección con esquema seguro', 'Ana https://ana.uy', 'web'],
    ['una dirección sin cifrar', 'Ana http://ana.uy', 'web'],
    ['una dirección sin cifrar con un dominio que no está en la lista', 'Ana http://ana.ar', 'web'],
    ['un dominio suelto', 'Ana ana.com.uy', 'web'],
    ['un teléfono de nueve dígitos', 'Ana 099123456', 'phone'],
    ['un teléfono con espacios', 'Ana 099 123 456', 'phone'],
    ['un teléfono con guiones', 'Ana 099-123-456', 'phone'],
  ] as const)('detecta %s', (_caso, value, kind) => {
    expect(contactKind(value)).toBe(kind)
  })

  it.each([
    ['un barrio con número', 'Villa 25 de Agosto'],
    ['una ruta con kilómetro', 'Ruta 8 km 25'],
    ['un nombre con apóstrofo', "Ana O'Neill"],
    ['una arroba suelta', 'Ana @ casa'],
    ['ocho dígitos, que no alcanzan para un teléfono', 'Casa 12345678'],
    ['un nombre común', 'Ana García'],
  ])('deja pasar %s', (_caso, value) => {
    expect(contactKind(value)).toBeNull()
  })

  it('el nombre con contacto se rechaza diciendo por qué', () => {
    expect(errorOf(profile({ displayName: 'Ana 099123456' }))).toBe(
      'profile.errors.name_has_contact',
    )
  })

  it('la localidad con contacto también', () => {
    expect(errorOf(profile({ locality: 'Pocitos ana@ejemplo.com' }))).toBe(
      'profile.errors.locality_has_contact',
    )
  })
})

// Covers: US2-AS4, FR-020. Con dos campos mal, la persona tiene que ver los dos, cada uno en su
// lugar: un error por vez la obliga a adivinar cuántos le faltan.
describe('los errores llegan por campo', () => {
  it('un perfil válido pasa y devuelve lo limpio', () => {
    const result = validateProfile(profile({ displayName: '  Ana   García ' }))
    expect(result.ok).toBe(true)
    expect(result.ok && result.data.displayName).toBe('Ana García')
  })

  it('cada campo mal trae su propio mensaje', () => {
    const result = validateProfile(profile({ displayName: '', locality: '', department: 'UY-XX' }))
    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors).toEqual({
      displayName: 'profile.errors.name_required',
      locality: 'profile.errors.locality_required',
      department: 'profile.errors.department_required',
    })
  })

  it('un solo campo mal no ensucia a los otros', () => {
    const result = validateProfile(profile({ displayName: 'A' }))
    expect(!result.ok && result.errors).toEqual({
      displayName: 'profile.errors.name_too_short',
    })
  })

  it('de un mismo campo se queda con el primer motivo, no con una pila', () => {
    const result = validateProfile(profile({ displayName: '' }))
    expect(!result.ok && Object.keys(result.errors)).toEqual(['displayName'])
  })

  it('una entrada que no es un objeto no pasa por válida y no inventa campos', () => {
    const result = validateProfile(null)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors).toEqual({})
  })
})
