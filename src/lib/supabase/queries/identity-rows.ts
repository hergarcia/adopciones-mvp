import {
  isIdentityOrigin,
  isRejectionReason,
  type IdentityOrigin,
  type RejectionReason,
} from '@/lib/verification/identity'

// Lo que llega de la base es `string`; los `check` ya garantizan los valores, y esto convierte esa
// garantía en algo que el compilador vea, sin castear.

export type Rejection = { rejectedOn: string; reason: RejectionReason }

export function toRejections(rows: { rejected_on: string; reason: string }[]): Rejection[] {
  return rows.flatMap((row) =>
    isRejectionReason(row.reason) ? [{ rejectedOn: row.rejected_on, reason: row.reason }] : [],
  )
}

export function toOrigin(value: string | null | undefined): IdentityOrigin {
  return value !== null && value !== undefined && isIdentityOrigin(value) ? value : 'profile'
}
