import { LinkButton } from '@/components/ui/link-button'
import { IdentityStamp } from '@/components/verification/identity-stamp'
import { SupportSentence } from '@/components/verification/support-sentence'

/** Qué puede hacer hoy: pedirla, esperar la revisión, o esperar a que se le vaya el tope. */
export type IdentityRequiredState = 'request' | 'in_review' | 'capped'

type Props = {
  state: IdentityRequiredState
  /** Ya traducidos. `lines` dice el estado del pedido; una línea puede traer `{email}`. */
  texts: {
    title: string
    body: string
    stamp: string
    lines: string[]
    verify: string
    back: string
  }
  hrefs: { verify: string; back: string }
  supportEmail: string
}

// Un aviso en la puerta, antes de cualquier pregunta (US3-AS3): quien publicó pide identidad
// verificada y para qué sirve. Con algo que hacer, «Verificar mi identidad» es la tirita; con el
// pedido en revisión o con el tope, el sello y el estado, y volver al animal es la única salida.
export function IdentityRequired({ state, texts, hrefs, supportEmail }: Props) {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="afiche text-2xl break-words text-ink">{texts.title}</h1>
        <p className="text-base text-ink">{texts.body}</p>
      </header>

      {state === 'request' ? null : (
        <div className="flex flex-col gap-3">
          <IdentityStamp kind={state} label={texts.stamp} />
          {texts.lines.map((line) => (
            <p key={line} className="text-base text-ink tabular-nums">
              <SupportSentence template={line} email={supportEmail} />
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
        {state === 'request' ? (
          <LinkButton href={hrefs.verify} variant="tirita" size="lg" className="md:w-auto">
            {texts.verify}
          </LinkButton>
        ) : null}
        <LinkButton href={hrefs.back} variant="ghost">
          {texts.back}
        </LinkButton>
      </div>
    </section>
  )
}
