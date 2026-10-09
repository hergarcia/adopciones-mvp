import { button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

export type IdentityConsentTexts = {
  whatTitle: string
  whatBody: string
  useTitle: string
  /** Lo de FR-004 que da confianza, primero y con peso: nadie más lo ve, se borra, no se guarda. */
  promises: string[]
  /** El resto de FR-004, como letra chica: quién lo ve, retirar, qué queda. */
  details: string[]
  accepted: string
  readAgain: string
}

type Props = {
  texts: IdentityConsentTexts
  /** Aceptado, se pliega a una línea para dejar las fotos a la vista sin perder el texto. */
  accepted: boolean
}

// Lo que se hace con las imágenes, antes de subir nada (FR-003, FR-004). Las promesas que compran la
// confianza van primero, en una nota que pegamos con cinta y sin inclinar, porque se lee; cada una
// con el tilde en yerba, que es la confianza. El detalle de qué queda y quién lo ve, debajo como
// letra chica. Plegado es un `details` nativo: se vuelve a leer sin JavaScript.
export function IdentityConsent({ texts, accepted }: Props) {
  const body = <IdentityConsentBody texts={texts} />
  if (!accepted) return body

  return (
    <details className="group/consent">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-2 gap-y-1 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2 text-base text-ink">
          <CheckIcon className="size-4 shrink-0 text-primary" />
          {texts.accepted}
        </span>
        <span className={cn(button({ variant: 'ghost', size: 'sm' }))}>{texts.readAgain}</span>
      </summary>
      <div className="mt-4">{body}</div>
    </details>
  )
}

type BodyTexts = Pick<
  IdentityConsentTexts,
  'whatTitle' | 'whatBody' | 'useTitle' | 'promises' | 'details'
>

type BodyProps = {
  texts: BodyTexts
  /** 3 debajo del `h2` de otra página, como en «Cómo se verifica». */
  headingLevel?: 2 | 3
}

// Sin directiva ni hooks: dibuja en el servidor desde «Cómo se verifica» y viaja con el formulario
// del pedido, que es cliente, como antes (research R8 de la #8).
export function IdentityConsentBody({ texts, headingLevel = 2 }: BodyProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2'
  return (
    <div className="flex flex-col gap-6">
      <section>
        <Heading className="text-lg font-bold text-ink">{texts.whatTitle}</Heading>
        <p className="mt-2 text-base text-ink">{texts.whatBody}</p>
      </section>
      <section>
        <Heading className="text-lg font-bold text-ink">{texts.useTitle}</Heading>
        <Card taped className="mt-6">
          <ul className="flex flex-col gap-3 text-base font-bold text-ink">
            {texts.promises.map((promise) => (
              <li key={promise} className="flex gap-3">
                <CheckIcon className="mt-1 size-4 shrink-0 text-primary" />
                {promise}
              </li>
            ))}
          </ul>
        </Card>
        <ul className="mt-4 flex flex-col gap-2 text-sm text-ink-muted">
          {texts.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
