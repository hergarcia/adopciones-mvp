import { createHash, randomBytes } from 'node:crypto'

const TOKEN_BYTES = 32
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/

// El token de un enlace que llega por correo («Sigue disponible», «Dejar de recibir»): 32 bytes al
// azar, que no se pueden adivinar ni armar a partir de otro. La base guarda solo su SHA-256.
export function newLinkToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url')
}

export function hashLinkToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Lo que no tiene la forma de un token no va a la base: es un enlace que no sirve. */
export function isLinkToken(value: string): boolean {
  return TOKEN_SHAPE.test(value)
}
