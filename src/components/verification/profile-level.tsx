import { LinkButton } from '@/components/ui/link-button'
import type { BadgeLevel } from '@/lib/verification/badge-parts'
import { VerificationBadge } from './verification-badge'

type Props =
  | {
      level: BadgeLevel
      /** A la explicación con este nivel destacado. */
      levelsHref: string
      /** Ya traducidos. `certifies`: lo que el nivel asegura, en palabras de quien mira. */
      texts: { badge: string; level: string; certifies: string }
    }
  | {
      level: 0
      /** A la explicación sin ningún nivel destacado (FR-024). */
      levelsHref: string
      texts: { unverified: string; levelsLink: string }
    }

// Qué tan verificada está una persona, en su perfil público: la chapita con su nivel y lo que ese
// nivel asegura, para que quien llega de un enlace lo entienda sin irse de la página; o, sin nivel,
// la nota de que todavía no se verificó, con el mismo texto sea cual sea el motivo (FR-006). Desde
// 1024 las dos son una banda que llena lo que la cabecera del perfil deja de la hoja: en yerba
// suave lo verificado, en piedra lo que no.
export function ProfileLevel(props: Props) {
  if (props.level === 0) {
    return (
      <div className="bg-surface p-4 lg:p-6">
        <p className="text-base text-ink">{props.texts.unverified}</p>
        <LinkButton href={props.levelsHref} variant="ghost" size="sm" prefetch={false}>
          {props.texts.levelsLink}
        </LinkButton>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 lg:bg-primary-soft lg:p-6">
      <VerificationBadge
        level={props.level}
        size="lg"
        href={props.levelsHref}
        label={props.texts.badge}
      />
      <div className="flex flex-col gap-1">
        <p className="afiche text-xl text-ink">{props.texts.level}</p>
        <p className="text-sm text-ink-muted tabular-nums">{props.texts.certifies}</p>
      </div>
    </div>
  )
}
