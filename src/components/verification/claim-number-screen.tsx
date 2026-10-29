import { SingleTaskColumns } from '@/components/forms/single-task-columns'
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
  /** «Ahora no», cuando se llegó por la puerta de una acción. */
  notNow?: React.ReactNode
}

// Quedarse con el número es la única acción del producto que le saca algo a otra persona: la
// pantalla dice primero qué le pasa a la otra cuenta, en el orden en que pasa, y recién abajo está
// la tirita (FR-006). Desde 1024 eso es la presentación, y la tirita va a la derecha.
export function ClaimNumberScreen({ texts, backHref, children, notNow = null }: Props) {
  return (
    <SingleTaskColumns
      presentation={
        <>
          <VerifyHeading texts={{ title: texts.title, lead: null }} />
          <div className="mt-6 flex flex-col gap-4 text-base text-ink">
            <p>{texts.loses}</p>
            <p>{texts.notified}</p>
            <p>{texts.wayBack}</p>
            {texts.previous ? <p className="font-medium">{texts.previous}</p> : null}
          </div>
        </>
      }
      task={
        <div className="mt-6 flex flex-col">
          <p className="text-sm text-ink-muted">{texts.deadline}</p>
          <div className="mt-4">{children}</div>
          <LinkButton href={backHref} variant="ghost" className="mt-4 self-start">
            {texts.back}
          </LinkButton>
          {notNow}
        </div>
      }
    />
  )
}
