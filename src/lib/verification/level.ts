import { isLevelOne, type PhoneStatus } from './phone-status'

export type VerificationLevel = 0 | 1 | 2

// Nivel 2 es nivel 1 más la identidad verificada (FR-023). La identidad es de la cuenta y no del
// número: sin nivel 1 la cuenta baja a 0 aunque la tenga, y vuelve a 2 al verificar un teléfono.
export function verificationLevel(
  phone: PhoneStatus,
  identity: { verifiedOn: string } | null,
): VerificationLevel {
  if (!isLevelOne(phone)) return 0
  return identity === null ? 1 : 2
}
