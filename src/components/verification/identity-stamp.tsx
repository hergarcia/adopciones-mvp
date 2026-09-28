import { Stamp, type StampTone } from '@/components/ui/stamp'
import type { IdentityStatus } from '@/lib/verification/identity-status'

// Yerba solo lo verificado, mate cocido en la revisión —le toca actuar a alguien—, y gris lo que ya
// se cerró sin verificar. El sello dice el estado y no el nivel, que va en texto (docs/10, decisión
// 2026-09-22).
const TONE: Record<IdentityStatus['kind'], StampTone> = {
  none: 'muted',
  in_review: 'warning',
  approved: 'primary',
  rejected: 'muted',
  expired: 'muted',
  capped: 'muted',
}

type Props = { kind: IdentityStatus['kind']; label: string; size?: 'md' | 'lg' }

export function IdentityStamp({ kind, label, size }: Props) {
  return (
    <Stamp tone={TONE[kind]} size={size}>
      {label}
    </Stamp>
  )
}
