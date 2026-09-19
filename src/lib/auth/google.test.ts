import { describe, expect, it } from 'vitest'
import { isVerifiedByGoogle, type ProviderIdentity } from './google'

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
