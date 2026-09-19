import { describe, expect, it } from 'vitest'
import { emailSchema } from './auth'

// Covers: US1-AS10 (correo mal formado, no se manda nada), FR-002
describe('el correo que se escribe para pedir el enlace', () => {
  it('acepta una dirección común', () => {
    const result = emailSchema.safeParse({ email: 'ana@ejemplo.com' })
    expect(result.success).toBe(true)
    expect(result.data?.email).toBe('ana@ejemplo.com')
  })

  it('recorta los espacios que deja el teclado del teléfono', () => {
    const result = emailSchema.safeParse({ email: '  ana@ejemplo.com  ' })
    expect(result.success).toBe(true)
    expect(result.data?.email).toBe('ana@ejemplo.com')
  })

  it('guarda la dirección en minúsculas, para que una persona sea una cuenta', () => {
    const result = emailSchema.safeParse({ email: 'Ana@Ejemplo.COM' })
    expect(result.success).toBe(true)
    expect(result.data?.email).toBe('ana@ejemplo.com')
  })

  it('rechaza el vacío pidiendo que escriba, no diciendo que está mal', () => {
    const result = emailSchema.safeParse({ email: '   ' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('auth.errors.email_required')
  })

  it.each([
    ['sin arroba', 'ana.ejemplo.com'],
    ['sin dominio', 'ana@'],
    ['sin punto en el dominio', 'ana@ejemplo'],
    ['con un espacio en el medio', 'an a@ejemplo.com'],
    ['solo la arroba', '@'],
  ])('rechaza una dirección %s', (_caso, email) => {
    const result = emailSchema.safeParse({ email })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('auth.errors.email_format')
  })

  it('rechaza una dirección más larga que lo que admite el estándar', () => {
    const email = `${'a'.repeat(250)}@ejemplo.com`
    const result = emailSchema.safeParse({ email })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('auth.errors.email_format')
  })

  it('acepta una dirección de exactamente el largo máximo', () => {
    const local = 'a'.repeat(254 - '@ejemplo.com'.length)
    const result = emailSchema.safeParse({ email: `${local}@ejemplo.com` })
    expect(result.success).toBe(true)
  })
})
