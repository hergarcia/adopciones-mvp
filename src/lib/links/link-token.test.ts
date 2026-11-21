// Covers: FR-019 de #59 y FR-030 de #265 (el enlace no se adivina y la base guarda solo su hash)
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { hashLinkToken, isLinkToken, newLinkToken } from './link-token'

describe('newLinkToken', () => {
  it('son 43 caracteres base64url', () => {
    const token = newLinkToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(Buffer.from(token, 'base64url')).toHaveLength(32)
  })

  it('dos tokens nunca son el mismo', () => {
    expect(newLinkToken()).not.toBe(newLinkToken())
  })
})

describe('hashLinkToken', () => {
  it('es el SHA-256 del token en hex', () => {
    const token = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ'
    expect(hashLinkToken(token)).toBe(createHash('sha256').update(token).digest('hex'))
    expect(hashLinkToken(token)).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('isLinkToken', () => {
  it('acepta un token recién creado', () => {
    expect(isLinkToken(newLinkToken())).toBe(true)
    expect(isLinkToken('A-_zA-_zA-_zA-_zA-_zA-_zA-_zA-_zA-_zA-_z012')).toBe(true)
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
    expect(isLinkToken(value)).toBe(false)
  })
})
