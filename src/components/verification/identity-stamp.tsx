import { cva } from 'class-variance-authority'
import type { IdentityStatus } from '@/lib/verification/identity-status'

// El estado del pedido es un sello (docs/10 §Recursos del cartel): yerba solo lo verificado, mate
// cocido cuando le toca actuar a alguien —la revisión—, y gris lo que ya se cerró sin verificar. El
// sello dice el estado y no el nivel, que va en texto (docs/10, decisión 2026-09-22).
const stamp = cva('sello text-sm', {
  variants: {
    kind: {
      none: 'text-ink-muted',
      in_review: 'text-warning',
      approved: 'text-primary',
      rejected: 'text-ink-muted',
      expired: 'text-ink-muted',
      capped: 'text-ink-muted',
    },
  },
})

export function IdentityStamp({ kind, label }: { kind: IdentityStatus['kind']; label: string }) {
  return <span className={stamp({ kind })}>{label}</span>
}
