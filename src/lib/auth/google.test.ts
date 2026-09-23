import { describe, expect, it } from 'vitest'
import { isVerifiedByGoogle, profileSuggestionFrom, type ProviderIdentity } from './google'

function google(identityData: Record<string, unknown> | null): ProviderIdentity {
  return { provider: 'google', identityData }
}

// Covers: US3-AS5, FR-009, FR-009a. Si esto se equivoca, alguien entra a la cuenta de otra
// persona con una dirección que Google nunca confirmó, y ve su correo y su perfil.
describe('si Google confirmó la dirección en este ingreso', () => {
  it('sí, cuando la identidad de Google lo dice', () => {
    expect(isVerifiedByGoogle([google({ email_verified: true })])).toBe(true)
  })

  it('no, cuando la identidad de Google dice que no', () => {
    expect(isVerifiedByGoogle([google({ email_verified: false })])).toBe(false)
  })

  it('no, cuando la identidad de Google no lo dice', () => {
    expect(isVerifiedByGoogle([google({})])).toBe(false)
  })

  it('no, cuando la identidad de Google no trae datos', () => {
    expect(isVerifiedByGoogle([google(null)])).toBe(false)
  })

  it('no, cuando no hay ninguna identidad de Google', () => {
    expect(isVerifiedByGoogle([])).toBe(false)
    expect(
      isVerifiedByGoogle([{ provider: 'email', identityData: { email_verified: true } }]),
    ).toBe(false)
  })

  it('mira la identidad de Google y no la de otro proveedor', () => {
    const identities = [
      { provider: 'email', identityData: { email_verified: true } },
      google({ email_verified: false }),
    ]
    expect(isVerifiedByGoogle(identities)).toBe(false)
  })

  it('exige el valor booleano, no una cadena parecida', () => {
    expect(isVerifiedByGoogle([google({ email_verified: 'true' })])).toBe(false)
    expect(isVerifiedByGoogle([google({ email_verified: 1 })])).toBe(false)
  })
})

const PHOTO = 'https://lh3.googleusercontent.com/a/ACg8ocJx'

// Covers: US3-AS6, FR-030b. Si esto se equivoca, el alta llega con un nombre que el propio
// formulario rechaza, o con datos de otro proveedor en lugar de los de Google.
describe('lo que el alta sugiere a partir de la cuenta de Google', () => {
  it('el nombre completo y la foto de la identidad de Google', () => {
    const suggestion = profileSuggestionFrom([
      google({ full_name: 'Ana García', avatar_url: `${PHOTO}=s96-c` }),
    ])
    expect(suggestion).toEqual({ displayName: 'Ana García', photoUrl: `${PHOTO}=s256-c` })
  })

  it('el nombre completo antes que el corto, y avatar_url antes que picture', () => {
    const suggestion = profileSuggestionFrom([
      google({
        full_name: 'Ana García',
        name: 'Ana',
        avatar_url: `${PHOTO}=s96-c`,
        picture: 'https://lh3.googleusercontent.com/a/otra=s96-c',
      }),
    ])
    expect(suggestion).toEqual({ displayName: 'Ana García', photoUrl: `${PHOTO}=s256-c` })
  })

  it('el nombre corto y picture cuando no vienen los otros', () => {
    const suggestion = profileSuggestionFrom([google({ name: 'Ana', picture: `${PHOTO}=s96-c` })])
    expect(suggestion).toEqual({ displayName: 'Ana', photoUrl: `${PHOTO}=s256-c` })
  })

  it('limpia los espacios de más como lo haría el formulario', () => {
    const { displayName } = profileSuggestionFrom([google({ full_name: '  Ana   García ' })])
    expect(displayName).toBe('Ana García')
  })

  it('no sugiere un nombre que el formulario rechazaría', () => {
    for (const rejected of ['A', 'a'.repeat(61), 'Ana ana@correo.com', 'Ana 099 123 456', '   ']) {
      expect(profileSuggestionFrom([google({ full_name: rejected })]).displayName).toBeNull()
    }
  })

  it('no sugiere nada que no sea texto, ni una foto vacía', () => {
    const suggestion = profileSuggestionFrom([google({ full_name: 42, avatar_url: '' })])
    expect(suggestion).toEqual({ displayName: null, photoUrl: null })
    expect(profileSuggestionFrom([google({ avatar_url: 42 })]).photoUrl).toBeNull()
  })

  it('cambia solo el tamaño que va al final de la dirección', () => {
    expect(profileSuggestionFrom([google({ avatar_url: PHOTO })]).photoUrl).toBe(PHOTO)
    expect(profileSuggestionFrom([google({ avatar_url: `${PHOTO}=s96-cx` })]).photoUrl).toBe(
      `${PHOTO}=s96-cx`,
    )
  })

  it('mira la identidad de Google y no la de otro proveedor', () => {
    const suggestion = profileSuggestionFrom([
      { provider: 'email', identityData: { full_name: 'Otra Persona', avatar_url: PHOTO } },
      google({ full_name: 'Ana García' }),
    ])
    expect(suggestion).toEqual({ displayName: 'Ana García', photoUrl: null })
  })

  it('nada, sin identidad de Google o sin datos en ella', () => {
    const none = { displayName: null, photoUrl: null }
    expect(profileSuggestionFrom([])).toEqual(none)
    expect(profileSuggestionFrom([google(null)])).toEqual(none)
  })
})
