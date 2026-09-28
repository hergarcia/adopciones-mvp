import {
  isIdentityOrigin,
  isRejectionReason,
  type IdentityOrigin,
} from '@/lib/verification/identity'
import type { Rejection } from '@/lib/verification/rejections'

// Lo que llega de la base es `string`; los `check` ya garantizan los valores, y esto convierte esa
// garantía en algo que el compilador vea, sin castear.

export function toRejections(
  rows: { id: number; rejected_on: string; reason: string }[],
): Rejection[] {
  return rows.flatMap((row) =>
    isRejectionReason(row.reason)
      ? [{ rejectedOn: row.rejected_on, reason: row.reason, sequence: row.id }]
      : [],
  )
}

export function toOrigin(value: string | null | undefined): IdentityOrigin {
  return value !== null && value !== undefined && isIdentityOrigin(value) ? value : 'profile'
}
