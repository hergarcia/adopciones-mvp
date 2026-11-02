import { Card } from '@/components/ui/card'
import { LinkButton } from '@/components/ui/link-button'
import { IdentityInviteFrame, IdentityInviteNotNow } from './identity-invite-frame'

export type IdentityInviteTexts = {
  title: string
  /** Qué cambia y dónde, con «Identidad verificada» ya envuelto en `VerifiedWords`. */
  change: React.ReactNode
  photos: string
  verify: string
  notNow: string
}

type Props = {
  texts: IdentityInviteTexts
  href: string
  /** El `h1` de la pantalla, que recibe el foco al cerrar la nota. */
  focusId: string
}

const TITLE_ID = 'invitacion-identidad'

/** Las palabras del nivel en el verde de lo verificado, como `PublisherLevelLine`. */
export function VerifiedWords({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-primary">{children}</span>
}

export function IdentityInvite({ texts, href, focusId }: Props) {
  return (
    <IdentityInviteFrame focusId={focusId}>
      <section aria-labelledby={TITLE_ID}>
        <Card taped className="grid gap-y-4 lg:grid-cols-2 lg:gap-x-16 lg:p-8">
          <h2
            id={TITLE_ID}
            className="afiche max-w-[var(--measure)] text-xl text-ink lg:col-start-1"
          >
            {texts.title}
          </h2>
          <p className="max-w-[var(--measure)] text-base text-ink lg:col-start-1">{texts.change}</p>
          <div className="flex max-w-[var(--measure)] flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
            <p className="text-sm text-ink-muted">{texts.photos}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
              <LinkButton href={href} variant="secondary" size="md" className="w-full sm:w-auto">
                {texts.verify}
              </LinkButton>
              <IdentityInviteNotNow label={texts.notNow} />
            </div>
          </div>
        </Card>
      </section>
    </IdentityInviteFrame>
  )
}
