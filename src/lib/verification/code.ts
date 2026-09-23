import { createHmac, hkdfSync, randomInt } from 'node:crypto'
import { requireEnv } from '@/lib/env'
import { CODE_LENGTH } from './rules'

type Random = (min: number, max: number) => number

export function generateCode(random: Random = randomInt): string {
  return String(random(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, '0')
}

// Las dos claves se derivan de la de servicio, que el servidor ya tiene y ninguna tabla guarda:
// quien tenga una copia de la base no puede recalcular un código (FR-009b). La etiqueta separa los
// usos, así que conocer una clave no da la otra.
function derivedKey(label: 'phone-code' | 'phone-number', secret: string): Buffer {
  return Buffer.from(hkdfSync('sha256', secret, Buffer.alloc(0), label, 32))
}

function serviceSecret(): string {
  return requireEnv('SUPABASE_SERVICE_ROLE_KEY')
}

// La cuenta va adentro para que el mismo código en dos cuentas no dé el mismo resumen.
export function codeDigest(userId: string, code: string, secret = serviceSecret()): string {
  return createHmac('sha256', derivedKey('phone-code', secret))
    .update(`${userId}:${code}`)
    .digest('hex')
}

// Los primeros 15 bits: cada grupo son unos 275 celulares uruguayos, así que ni con la clave se
// sabe de cuál se trata, y el conteo sirve para el tope sin poder leerse (FR-021).
export function numberGroup(e164: string, secret = serviceSecret()): number {
  const digest = createHmac('sha256', derivedKey('phone-number', secret)).update(e164).digest()
  return digest.readUInt16BE(0) >> 1
}
