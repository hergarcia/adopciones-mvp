import { PENDING_TTL_DAYS } from './rules'

export type PhoneRow = {
  verifiedNumber: string | null
  verifiedAt: Date | null
  pendingNumber: string | null
  pendingSince: Date | null
}

export type VerifiedPhoneData = { number: string; since: Date }

export type PhoneStatus =
  | { kind: 'none' }
  | ({ kind: 'verified' } & VerifiedPhoneData)
  | { kind: 'pending'; number: string }
  | { kind: 'pending_change'; number: string; previous: VerifiedPhoneData }

const PENDING_TTL_MS = PENDING_TTL_DAYS * 24 * 60 * 60 * 1000

// El estado del teléfono de una cuenta, que es lo que «Mi perfil» y las pantallas de verificar
// muestran (FR-018). Un número a medias de más de 7 días ya no cuenta, aunque la purga todavía no
// lo haya borrado: se descarta como si se hubiera cancelado y vuelve el anterior (FR-015, FR-017b).
export function phoneStatus(row: PhoneRow | null, now: Date): PhoneStatus {
  const verified =
    row?.verifiedNumber && row.verifiedAt
      ? { number: row.verifiedNumber, since: row.verifiedAt }
      : null

  const pendingAlive =
    row?.pendingNumber &&
    row.pendingSince &&
    now.getTime() - row.pendingSince.getTime() < PENDING_TTL_MS
      ? row.pendingNumber
      : null

  if (pendingAlive !== null && verified !== null) {
    return { kind: 'pending_change', number: pendingAlive, previous: verified }
  }
  if (pendingAlive !== null) return { kind: 'pending', number: pendingAlive }
  if (verified !== null) return { kind: 'verified', ...verified }
  return { kind: 'none' }
}

// Nivel 1: el correo siempre está confirmado en este producto (historia #9), así que alcanza con un
// teléfono verificado y ningún cambio a medias (FR-012). Un cambio a medias baja la cuenta a sin
// verificar hasta confirmar el nuevo (FR-017).
export function isLevelOne(status: PhoneStatus): boolean {
  return status.kind === 'verified'
}

export function hasPending(
  status: PhoneStatus,
): status is Extract<PhoneStatus, { kind: 'pending' | 'pending_change' }> {
  return status.kind === 'pending' || status.kind === 'pending_change'
}
