import { useId } from 'react'
import { Card } from '@/components/ui/card'
import { LinkButton } from '@/components/ui/link-button'
import { IdentityStamp } from '@/components/verification/identity-stamp'
import { VerificationBadge } from '@/components/verification/verification-badge'
import type { MyIdentityAskView } from '@/lib/applications/identity-ask'
import type { BadgeLevel } from '@/lib/verification/badge-parts'

export type IdentityAskNoteTexts = {
  title: string
  /** «Nivel 1» o «Sin verificar», el de quien publicó; nulo sin saberlo. */
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

// Una nota pegada en el cartel; el botón va abajo, afuera, para no apilar la cinta con la tirita
// (docs/10 §Recursos, un gesto por elemento). Nunca lleva a un formulario que no se puede mandar.
export function IdentityAskNote({ view, texts, badge, href, emphasis }: Props) {
  const titleId = useId()
  const stampKind =
    view.kind === 'verified' ? 'approved' : view.kind === 'in_review' ? 'in_review' : null
  const canSend = view.kind === 'verify' || view.kind === 'retry'
  return (
    <section aria-labelledby={titleId} className="flex max-w-[var(--measure)] flex-col gap-6">
      <Card taped className="flex flex-col gap-4 md:p-6">
        <div className="flex items-start gap-3">
          {badge === null || texts.badge === null ? null : (
            <VerificationBadge
              level={badge.level}
              size="md"
              href={badge.href}
              label={texts.badge}
            />
          )}
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={titleId} className="afiche text-xl break-words text-ink">
              {texts.title}
            </h2>
            {texts.who === null ? null : <p className="text-sm text-ink-muted">{texts.who}</p>}
          </div>
        </div>
        {texts.body === null ? null : <p className="text-base text-ink">{texts.body}</p>}
        {stampKind === null || texts.stamp === null ? null : (
          <div className="self-start">
            <IdentityStamp kind={stampKind} label={texts.stamp} />
          </div>
        )}
        {texts.lines.map((line) => (
          <p key={line} className="text-sm text-ink">
            {line}
          </p>
        ))}
      </Card>
      {canSend && texts.action !== null ? (
        <LinkButton href={href} variant={emphasis} size="lg" className="md:w-auto md:self-start">
          {texts.action}
        </LinkButton>
      ) : null}
    </section>
  )
}
