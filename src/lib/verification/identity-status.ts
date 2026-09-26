import type { RejectionReason } from './identity'
import { IDENTITY_REJECTION_CAP, IDENTITY_REJECTION_WINDOW_DAYS, URUGUAY_TIME_ZONE } from './rules'

/** Lo que la base guarda de la verificación de una cuenta. Los días, `YYYY-MM-DD` de Uruguay. */
export type IdentityRecord = {
  request: { sentAt: Date; expiresAt: Date } | null
  verifiedOn: string | null
  rejections: readonly { rejectedOn: string; reason: RejectionReason }[]
  expiredOn: string | null
}

export type IdentityStatus =
  | { kind: 'none' }
  | { kind: 'in_review'; sentAt: Date; expiresAt: Date }
  | { kind: 'approved'; on: string }
  | { kind: 'rejected'; on: string; reason: RejectionReason; attemptsLeft: number }
  | { kind: 'expired'; on: string }
  | { kind: 'capped'; on: string; reason: RejectionReason; retryOn: string }

const DAY_MS = 24 * 60 * 60 * 1000

/** El día de Uruguay de un instante, `YYYY-MM-DD`. */
export function uruguayDay(at: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: URUGUAY_TIME_ZONE }).format(at)
}

export function addDays(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
}

// Lo que ve la persona de su verificación (§Pantallas, Estado de mi pedido). Un pedido vencido se
// ve vencido desde el instante exacto, aunque la tarea todavía no lo haya borrado (FR-028). Solo
// cuentan los rechazos y los vencimientos de los últimos 30 días (FR-031): pasado eso, es como si
// nunca hubiera pedido. Un vencimiento guardado siempre es posterior a los rechazos, porque enviar
// otro pedido lo borra.
export function identityStatus(record: IdentityRecord, now: Date): IdentityStatus {
  if (record.verifiedOn !== null) return { kind: 'approved', on: record.verifiedOn }

  const { request } = record
  if (request !== null && request.expiresAt.getTime() > now.getTime()) {
    return { kind: 'in_review', sentAt: request.sentAt, expiresAt: request.expiresAt }
  }
  if (request !== null) return { kind: 'expired', on: uruguayDay(request.expiresAt) }

  const windowStart = addDays(uruguayDay(now), -IDENTITY_REJECTION_WINDOW_DAYS)
  const recent = record.rejections
    .filter((rejection) => rejection.rejectedOn > windowStart)
    .toSorted((a, b) => b.rejectedOn.localeCompare(a.rejectedOn))
  // El más viejo de los que dejan a la cuenta en el tope: el día en que sale de la ventana, vuelve a
  // poder pedir (FR-027).
  const oldest = recent[IDENTITY_REJECTION_CAP - 1]
  if (oldest !== undefined) {
    const latest = recent[0] ?? oldest
    return {
      kind: 'capped',
      on: latest.rejectedOn,
      reason: latest.reason,
      retryOn: addDays(oldest.rejectedOn, IDENTITY_REJECTION_WINDOW_DAYS),
    }
  }
  const expiredOn = record.expiredOn ?? ''
  if (expiredOn > windowStart) return { kind: 'expired', on: expiredOn }

  const latest = recent[0]
  if (latest !== undefined) {
    return {
      kind: 'rejected',
      on: latest.rejectedOn,
      reason: latest.reason,
      attemptsLeft: IDENTITY_REJECTION_CAP - recent.length,
    }
  }
  return { kind: 'none' }
}

/** Puede empezar un pedido: nada abierto, nada aprobado, sin el tope. */
export function canRequest(status: IdentityStatus): boolean {
  return status.kind === 'none' || status.kind === 'rejected' || status.kind === 'expired'
}
