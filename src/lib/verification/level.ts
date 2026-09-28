import { identityStatus, type IdentityRecord, type IdentityStatus } from './identity-status'
import { isLevelOne, phoneStatus, type PhoneRow, type PhoneStatus } from './phone-status'

export type VerificationLevel = 0 | 1 | 2 | 3

// La escalera, una sola para «Mi perfil», la verificación aprobada y el perfil público (FR-003).
// Nivel 2 es nivel 1 más la identidad; nivel 3, nivel 2 más un aval que cuenta. La identidad es de
// la cuenta y no del número: sin nivel 1 la cuenta baja a 0 aunque la tenga, avales incluidos.
function ladder(
  levelOne: boolean,
  hasIdentity: boolean,
  countingVouches: number,
): VerificationLevel {
  if (!levelOne) return 0
  if (!hasIdentity) return 1
  return countingVouches > 0 ? 3 : 2
}

export function verificationLevel(
  phone: PhoneStatus,
  identity: IdentityStatus,
  countingVouches = 0,
): VerificationLevel {
  return ladder(isLevelOne(phone), identity.kind === 'approved', countingVouches)
}

// Lo de quien tiene la sesión, desde sus filas: el mismo camino en «Mi perfil», la verificación de la
// identidad y el lugar de avalar. Sin fila de identidad es como no haber pedido nunca.
export function myVerification(
  rows: { phone: PhoneRow | null; identity: IdentityRecord | null; countingVouches?: number },
  now: Date,
): { phone: PhoneStatus; identity: IdentityStatus; level: VerificationLevel } {
  const phone = phoneStatus(rows.phone, now)
  const identity: IdentityStatus =
    rows.identity === null ? { kind: 'none' } : identityStatus(rows.identity, now)
  return { phone, identity, level: verificationLevel(phone, identity, rows.countingVouches) }
}

// Lo que la base deja ver de otra persona ya viene recortado: la identidad solo sale con nivel 1 y
// los avales, solo los que cuentan.
export function publicLevel(profile: {
  levelOne: boolean
  identitySince: string | null
  vouchers: readonly unknown[]
}): VerificationLevel {
  return ladder(profile.levelOne, profile.identitySince !== null, profile.vouchers.length)
}
