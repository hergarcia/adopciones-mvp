import { z } from 'zod'
import { HELD_MAIL_OUTCOMES, type HeldMailLine } from '@/lib/email/held-mail'
import type { Json } from '@/lib/supabase/types'
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

const heldMailLines = z.array(
  z.object({
    name: z.string(),
    outcome: z.enum(HELD_MAIL_OUTCOMES),
    until: z.string().nullable(),
  }),
)

// Lo que pasó con las que esperaban la identidad (historia #289). Si la forma no es la esperada, el
// correo sale como el de siempre en lugar de no salir.
export function toHeldMailLines(value: Json | null | undefined): HeldMailLine[] {
  const parsed = heldMailLines.safeParse(value)
  return parsed.success ? parsed.data : []
}
