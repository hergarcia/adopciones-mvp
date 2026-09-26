import { button } from '@/components/ui/button'
import { CheckIcon } from '@/components/ui/icons'

export type IdentityConsentTexts = {
  whatTitle: string
  whatBody: string
  useTitle: string
  /** Lo de FR-004, una frase por renglón: quién ve, cuándo se borra, qué queda, retirar, nadie más. */
  points: string[]
  accepted: string
  readAgain: string
}

type Props = {
  texts: IdentityConsentTexts
  /** Aceptado, se pliega a una línea para dejar las fotos a la vista sin perder el texto. */
  accepted: boolean
}

// Lo que se hace con las imágenes, antes de subir nada (FR-003, FR-004). Plegado es un `details`
// nativo: se vuelve a leer sin JavaScript.
export function IdentityConsent({ texts, accepted }: Props) {
  const body = <ConsentBody texts={texts} />
  if (!accepted) return body

  return (
    <details className="group/consent">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-2 gap-y-1 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2 text-base text-ink">
          <CheckIcon className="size-4 shrink-0 text-primary" />
          {texts.accepted}
        </span>
        <span className={button({ variant: 'ghost', size: 'sm' })}>{texts.readAgain}</span>
      </summary>
      <div className="mt-4">{body}</div>
    </details>
  )
}

function ConsentBody({ texts }: { texts: IdentityConsentTexts }) {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-lg font-bold text-ink">{texts.whatTitle}</h2>
        <p className="mt-2 text-base text-ink">{texts.whatBody}</p>
      </section>
      <section>
        <h2 className="text-lg font-bold text-ink">{texts.useTitle}</h2>
        <ul className="mt-3 flex flex-col gap-3 bg-surface p-4 text-base text-ink">
          {texts.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
