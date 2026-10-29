import { useId } from 'react'
import { Card } from '@/components/ui/card'
import { LinkButton } from '@/components/ui/link-button'
import { IdentityStamp } from '@/components/verification/identity-stamp'
import { VerificationBadge } from '@/components/verification/verification-badge'
import type { MyIdentityAskView } from '@/lib/applications/identity-ask'
import type { BadgeLevel } from '@/lib/verification/badge-parts'

export type IdentityAskNoteTexts = {
  title: string
  /** «Carla, nivel 1»; nulo con la identidad ya verificada. */
  who: string | null
  /** La chapita de quien publicó en voz alta; nula sin chapita. */
  badge: string | null
  body: string | null
  /** El estado de su pedido de verificación, debajo de lo que se pide. */
  lines: string[]
  stamp: string | null
  action: string | null
}

type Props = {
  view: Exclude<MyIdentityAskView, { kind: 'none' }>
  texts: IdentityAskNoteTexts
  /** La chapita de quien publicó, con su enlace a la explicación de los niveles. */
  badge: { level: BadgeLevel; href: string } | null
  href: string
  /** Una tirita por pantalla: con una pregunta sin contestar, la tirita es «Enviar respuesta». */
  emphasis: 'tirita' | 'secondary'
}

// En Mi solicitud, el pedido de identidad de quien publicó (historia #257, plan §Diseño): quién lo
// pide con su chapita y qué se pide; al pie, el camino a verificar o, si ya no hay nada que mandar,
// el estado. Nunca un camino que termine en un formulario que no se puede mandar (FR-015).
export function IdentityAskNote({ view, texts, badge, href, emphasis }: Props) {
  const titleId = useId()
  const stampKind =
    view.kind === 'verified' ? 'approved' : view.kind === 'in_review' ? 'in_review' : null
  const canSend = view.kind === 'verify' || view.kind === 'retry'
  return (
    <section aria-labelledby={titleId} className="max-w-[var(--measure)]">
      <Card className="flex flex-col gap-4">
        <h2 id={titleId} className="text-xl font-bold break-words text-ink">
          {texts.title}
        </h2>
        {texts.who === null ? null : (
          <p className="flex items-center gap-3 text-sm text-ink">
            {badge === null || texts.badge === null ? null : (
              <VerificationBadge
                level={badge.level}
                size="md"
                href={badge.href}
                label={texts.badge}
              />
            )}
            {texts.who}
          </p>
        )}
        {texts.body === null ? null : <p className="text-base text-ink">{texts.body}</p>}
        {stampKind === null || texts.stamp === null ? null : (
          <div className="self-start">
            <IdentityStamp kind={stampKind} label={texts.stamp} />
          </div>
        )}
        {texts.lines.map((line) => (
          <p key={line} className="text-sm text-ink tabular-nums">
            {line}
          </p>
        ))}
        {canSend && texts.action !== null ? (
          <LinkButton href={href} variant={emphasis} size="lg" className="md:w-auto md:self-start">
            {texts.action}
          </LinkButton>
        ) : null}
      </Card>
    </section>
  )
}
