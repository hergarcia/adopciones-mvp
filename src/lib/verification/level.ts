import { isLevelOne, type PhoneStatus } from './phone-status'

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
  identity: { verifiedOn: string } | null,
  countingVouches = 0,
): VerificationLevel {
  return ladder(isLevelOne(phone), identity !== null, countingVouches)
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
