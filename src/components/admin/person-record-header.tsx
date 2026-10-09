import { Avatar } from '@/components/profile/avatar'
import { Stamp } from '@/components/ui/stamp'
import { VerificationBadge } from '@/components/verification/verification-badge'
import type { BadgeLevel } from '@/lib/verification/badge-parts'

type Props = {
  /** Ya traducidos. */
  name: string
  avatar: { url: string | null; alt: string }
  /** Sin nivel no hay chapita: la línea lo dice en palabras. */
  badge: { level: BadgeLevel; label: string } | null
  /** «Nivel 2, Salto» o «Sin teléfono verificado, Salto». */
  levelLine: string
  memberSince: string
  /** Si está suspendida: el sello, el motivo citado, y quién y cuándo. */
  suspension: { stamp: string; reason: string; by: string } | null
  /** «Suspender» o «Reactivar», que pone la página; nulo en la propia ficha. */
  action: React.ReactNode
}

// Quién es la persona de la ficha (FR-031): la foto, el nombre en voz de afiche, la chapita y la
// zona, desde cuándo tiene cuenta y, si está suspendida, por qué. Lo único que llama la atención es
// el sello de suspendida.
export function PersonRecordHeader({
  name,
  avatar,
  badge,
  levelLine,
  memberSince,
  suspension,
  action,
}: Props) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <Avatar displayName={name} url={avatar.url} alt={avatar.alt} size="lg" />
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="afiche text-2xl break-words text-ink">{name}</h1>
          <div className="flex items-center gap-2">
            {badge === null ? null : (
              <VerificationBadge level={badge.level} href={null} label={badge.label} />
            )}
            <p className="text-sm text-ink">{levelLine}</p>
          </div>
        </div>
      </div>
      <p className="text-sm text-ink-muted">{memberSince}</p>
      {suspension === null ? null : (
        <div className="flex max-w-[var(--measure)] flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Stamp tone="muted">{suspension.stamp}</Stamp>
            <p className="text-base break-words text-ink">{suspension.reason}</p>
          </div>
          <p className="text-sm text-ink-muted">{suspension.by}</p>
        </div>
      )}
      {action === null ? null : <div className="mt-2">{action}</div>}
    </header>
  )
}
