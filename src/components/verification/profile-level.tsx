import { LinkButton } from '@/components/ui/link-button'
import type { BadgeLevel } from '@/lib/verification/badge-parts'
import { VerificationBadge } from './verification-badge'

type Props =
  | {
      level: BadgeLevel
      /** A la explicación con este nivel destacado. */
      levelsHref: string
      /** Ya traducidos. `identitySince` solo desde nivel 2. */
      texts: { badge: string; level: string; identitySince: string | null }
    }
  | {
      level: 0
      /** A la explicación sin ningún nivel destacado (FR-024). */
      levelsHref: string
      texts: { unverified: string; levelsLink: string }
    }

// Qué tan verificada está una persona, en su perfil público: la chapita con su nivel y el mes de la
// identidad, o, sin nivel, la nota de que todavía no se verificó, con el mismo texto sea cual sea
// el motivo (FR-006).
export function ProfileLevel(props: Props) {
  if (props.level === 0) {
    return (
      <div className="bg-surface p-4">
        <p className="text-base text-ink">{props.texts.unverified}</p>
        <LinkButton href={props.levelsHref} variant="ghost" size="sm" prefetch={false}>
          {props.texts.levelsLink}
        </LinkButton>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <VerificationBadge
        level={props.level}
        size="lg"
        href={props.levelsHref}
        label={props.texts.badge}
      />
      <div className="flex flex-col gap-1">
        <p className="afiche text-xl text-ink">{props.texts.level}</p>
        {props.texts.identitySince === null ? null : (
          <p className="text-sm text-ink-muted tabular-nums">{props.texts.identitySince}</p>
        )}
      </div>
    </div>
  )
}
