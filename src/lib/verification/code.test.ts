import { afterEach, describe, expect, it, vi } from 'vitest'
import { codeDigest, generateCode, numberGroup } from './code'

const SECRET = 'clave-de-prueba'
const ANA = '11111111-1111-1111-1111-111111111111'
const LUCIA = '22222222-2222-2222-2222-222222222222'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('el código', () => {
  it('pide al azar un número entre 0 y un millón, sin incluir el millón', () => {
    const random = vi.fn<(min: number, max: number) => number>(() => 482017)
    expect(generateCode(random)).toBe('482017')
    expect(random).toHaveBeenCalledWith(0, 1_000_000)
  })

  it('siempre tiene seis dígitos, con ceros adelante si hace falta', () => {
    expect(generateCode(() => 7)).toBe('000007')
    expect(generateCode(() => 0)).toBe('000000')
    expect(generateCode(() => 999_999)).toBe('999999')
  })

  it('sin azar inyectado, igual da seis dígitos', () => {
    expect(generateCode()).toMatch(/^\d{6}$/)
  })
})

// Covers: FR-009b
describe('el resumen del código', () => {
  it('es exacto para una clave, una cuenta y un código', () => {
    expect(codeDigest(ANA, '482017', SECRET)).toBe(
      'ed61195c0c05e23b049dba9476fcacd08fdd2caa56fca93ff37f163f34e80511',
    )
  })

  it('cambia con la clave: sin ella, una copia de la tabla no sirve para nada', () => {
    expect(codeDigest(ANA, '482017', 'otra-clave')).toBe(
      'a14db921f3a19996247448eebb37cf95572f9830d0978bec56562a0a0fda1cce',
    )
  })

  it('cambia con la cuenta: el mismo código en dos cuentas no da lo mismo', () => {
    expect(codeDigest(LUCIA, '482017', SECRET)).not.toBe(codeDigest(ANA, '482017', SECRET))
  })

  it('sin clave pasada, usa la de servicio', () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', SECRET)
    expect(codeDigest(ANA, '482017')).toBe(codeDigest(ANA, '482017', SECRET))
  })
})

// Covers: FR-021
describe('el grupo del número', () => {
  it('es exacto para una clave y un número, y cabe en 15 bits', () => {
    expect(numberGroup('+59899123456', SECRET)).toBe(15348)
    expect(numberGroup('+59899123457', SECRET)).toBe(2867)
  })

  it('usa una clave distinta de la del código: la etiqueta separa los dos usos', () => {
    // Con la clave del código, este mismo número caería en el grupo 30020.
    expect(numberGroup('+59899123456', SECRET)).not.toBe(30020)
  })

  it('sin clave pasada, usa la de servicio', () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', SECRET)
    expect(numberGroup('+59899123456')).toBe(15348)
  })
})
