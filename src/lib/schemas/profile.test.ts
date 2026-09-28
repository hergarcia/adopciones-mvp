import { describe, expect, it } from 'vitest'
import { CONTACT_CASES, PASSING_CASES, STREET_NUMBER_CASES } from '@/lib/contact/contact-cases'
import { validatePet } from './pet'
import {
  LOCALITY_MAX,
  NAME_MAX,
  NAME_MIN,
  profileContactRejections,
  profileSchema,
  validateProfile,
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

// La ficha de un animal, válida salvo el campo que se prueba.
function petErrorOf(field: 'description' | 'locality', text: string) {
  const result = validatePet(
    {
      name: 'Luna',
      species: 'dog',
      sex: 'female',
      ageValue: '2',
      ageUnit: 'months',
      size: 'medium',
      isNeutered: 'yes',
      vaccines: 'up_to_date',
      hasChip: 'no',
      goodWithKids: 'unknown',
      goodWithDogs: 'yes',
      goodWithCats: 'no',
      description: '',
      department: 'UY-CA',
      locality: 'Atlántida',
      isUrgent: false,
      [field]: text,
    },
    { ageUnchanged: false },
  )
  const error = result.ok ? undefined : result.errors[field]
  return error === undefined
    ? undefined
    : { ...error, key: error.key.replace('pets.errors.', 'profile.errors.') }
}

function profileErrorOf(field: 'displayName' | 'locality', text: string) {
  const result = validateProfile(profile({ department: 'UY-CA', [field]: text }))
  return result.ok ? undefined : result.errors[field]
}

// El perfil limpia los espacios de más antes de validar; la paridad se prueba sobre ese texto.
function tidy(text: string): string {
  return text.trim().replaceAll(/\s+/g, ' ')
}

const TEXTS = [...CONTACT_CASES.map(([, text]) => text), ...PASSING_CASES.map(([, text]) => text)]
const LOCALITY_TEXTS = [...TEXTS, ...STREET_NUMBER_CASES.map(([text]) => text)].map(tidy)

// Covers: FR-020, SC-003. Una sola regla: lo que la ficha frena por contacto, el perfil también, y
// al revés, con el mismo tipo y el mismo fragmento; solo los textos que entran en el largo del campo
// del perfil, porque más largos el perfil los corta antes por largo.
describe('el perfil y la ficha, la misma regla de contacto', () => {
  const names = TEXTS.map(tidy).filter((text) => text.length >= NAME_MIN && text.length <= NAME_MAX)

  it('la tabla de la ficha tiene casos que se rechazan y casos que pasan', () => {
    expect(names.filter((text) => profileErrorOf('displayName', text) !== undefined).length).toBe(
      CONTACT_CASES.length,
    )
    expect(names.length).toBeGreaterThan(CONTACT_CASES.length)
  })

  it.each(names)('el nombre del perfil y la descripción de la ficha: «%s»', (text) => {
    expect(profileErrorOf('displayName', text)).toEqual(petErrorOf('description', text))
  })

  it.each(LOCALITY_TEXTS.filter((text) => text.length >= 1 && text.length <= LOCALITY_MAX))(
    'la localidad del perfil y la de la ficha: «%s»',
    (text) => {
      expect(profileErrorOf('locality', text)).toEqual(petErrorOf('locality', text))
    },
  )
})

// Covers: US2-AS1, US2-AS2, US2-AS3, SC-003. Los cuatro ejemplos de la historia.
describe('nada de vías de contacto en el nombre ni en la localidad', () => {
  it.each([
    ['Juan 099 123 456', 'phone', '099 123 456'],
    ['fijo 2401 2345', 'phone', '2401 2345'],
    ['t.me/juanrescata', 'web', 't.me/juanrescata'],
    ['@juanrescata', 'social', '@juanrescata'],
    ['juan@gmail.com', 'email', 'juan@gmail.com'],
  ])('«%s» se rechaza en los dos campos, citando lo que se encontró', (text, kind, fragment) => {
    const expected = { key: `profile.errors.contact_${kind}`, values: { fragment } }
    expect(profileErrorOf('displayName', text)).toEqual(expected)
    expect(profileErrorOf('locality', text)).toEqual(expected)
  })

  it.each(['Villa 25 de Agosto', 'Ruta 8 km 25'])('«%s» se guarda', (locality) => {
    expect(validateProfile(profile({ locality })).ok).toBe(true)
  })

  // Covers: US2-AS4. Con la etiqueta que el campo tiene en ese departamento.
  it('una dirección en la localidad dice que ahí va la zona, con el nombre del campo', () => {
    expect(profileErrorOf('locality', 'Av. Italia 3456')).toEqual({
      key: 'profile.errors.locality_street_number',
    })
    const montevideo = validateProfile(
      profile({ department: 'UY-MO', locality: 'Av. Italia 3456' }),
    )
    expect(!montevideo.ok && montevideo.errors.locality).toEqual({
      key: 'profile.errors.locality_street_number_montevideo',
    })
  })

  it('con las dos reglas a la vez, gana la de contacto', () => {
    expect(profileErrorOf('locality', 'fijo 2401 2345')?.key).toBe('profile.errors.contact_phone')
  })

  it('en el nombre, un número de puerta no es contacto', () => {
    expect(profileErrorOf('displayName', 'Ana 3456')).toBeUndefined()
  })
})

// Covers: FR-028. Solo el contacto se mide; el número de puerta no es contacto.
describe('lo que se mide de un rechazo', () => {
  it('cada campo rechazado por contacto, con su tipo', () => {
    expect(
      profileContactRejections({
        displayName: { key: 'profile.errors.contact_phone', values: { fragment: '099123456' } },
        locality: { key: 'profile.errors.contact_social', values: { fragment: '@x' } },
      }),
    ).toEqual([
      { field: 'displayName', kind: 'phone' },
      { field: 'locality', kind: 'social' },
    ])
  })

  it('ni el número de puerta, ni otro error, ni un campo sin error', () => {
    expect(
      profileContactRejections({
        displayName: { key: 'profile.errors.name_too_short' },
        locality: { key: 'profile.errors.locality_street_number' },
        department: { key: 'profile.errors.contact_web' },
      }),
    ).toEqual([])
    expect(profileContactRejections({})).toEqual([])
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
      displayName: { key: 'profile.errors.name_required' },
      locality: { key: 'profile.errors.locality_required' },
      department: { key: 'profile.errors.department_required' },
    })
  })

  it('un solo campo mal no ensucia a los otros', () => {
    const result = validateProfile(profile({ displayName: 'A' }))
    expect(!result.ok && result.errors).toEqual({
      displayName: { key: 'profile.errors.name_too_short' },
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
