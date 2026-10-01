// Covers: FR-019 (research R5: el enlace no se adivina y la base guarda solo su hash)
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { hashRenewalToken, isRenewalToken, newRenewalToken } from './renewal-token'

describe('newRenewalToken', () => {
  it('son 43 caracteres base64url', () => {
    const token = newRenewalToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(Buffer.from(token, 'base64url')).toHaveLength(32)
  })

  it('dos tokens nunca son el mismo', () => {
    expect(newRenewalToken()).not.toBe(newRenewalToken())
  })
})

describe('hashRenewalToken', () => {
  it('es el SHA-256 del token en hex', () => {
    const token = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ'
    expect(hashRenewalToken(token)).toBe(createHash('sha256').update(token).digest('hex'))
    expect(hashRenewalToken(token)).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('isRenewalToken', () => {
  it('acepta un token recién creado', () => {
    expect(isRenewalToken(newRenewalToken())).toBe(true)
    expect(isRenewalToken('A-_zA-_zA-_zA-_zA-_zA-_zA-_zA-_zA-_zA-_z012')).toBe(true)
  })

  it.each([
    ['uno corto', 'a'.repeat(42)],
    ['uno largo', 'a'.repeat(44)],
    ['con un carácter que no es base64url', `${'a'.repeat(42)}+`],
    ['con relleno', `${'a'.repeat(42)}=`],
    ['con algo antes', ` ${'a'.repeat(43)}`],
    ['con algo después', `${'a'.repeat(43)}/`],
    ['vacío', ''],
  ])('rechaza %s', (_, value) => {
    expect(isRenewalToken(value)).toBe(false)
  })
})
