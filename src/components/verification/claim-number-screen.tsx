import { LinkButton } from '@/components/ui/link-button'
import { VerifyHeading } from './verify-heading'

export type ClaimNumberScreenTexts = {
  /** Con el número ya puesto. */
  title: string
  loses: string
  notified: string
  wayBack: string
  /** Con el número verificado que esta cuenta deja, si tenía uno. */
  previous: string | null
  deadline: string
  back: string
}

type Props = {
  texts: ClaimNumberScreenTexts
  backHref: string
  /** La tirita de confirmar (`ClaimConfirmForm`). */
  children: React.ReactNode
}

// Quedarse con el número es la única acción del producto que le saca algo a otra persona: la
// pantalla dice primero qué le pasa a la otra cuenta, en el orden en que pasa, y recién abajo está
// la tirita (FR-006).
export function ClaimNumberScreen({ texts, backHref, children }: Props) {
  return (
    <div className="flex flex-col">
      <VerifyHeading texts={{ title: texts.title, lead: null }} />
      <div className="mt-6 flex flex-col gap-4 text-base text-ink">
        <p>{texts.loses}</p>
        <p>{texts.notified}</p>
        <p>{texts.wayBack}</p>
        {texts.previous ? <p className="font-medium">{texts.previous}</p> : null}
      </div>
      <p className="mt-6 text-sm text-ink-muted">{texts.deadline}</p>
      <div className="mt-4">{children}</div>
      <LinkButton href={backHref} variant="ghost" className="mt-4 self-start">
        {texts.back}
      </LinkButton>
    </div>
  )
}
