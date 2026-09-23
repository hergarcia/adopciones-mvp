import { LinkButton } from '@/components/ui/link-button'
import type { RetryDisplay } from '@/lib/verification/retry-at'
import { NotNowLink } from './not-now-link'
import { PhoneCodeForm, type PhoneCodeFormTexts } from './phone-code-form'

type Props = {
  /** El número a medias, ya en formato de pantalla. */
  number: string
  texts: {
    title: string
    /** Con `{number}` adentro. */
    sentTo: string
    correct: string
    notNow: string
    /** "Es para publicar un animal.", cuando se llegó por la puerta. */
    reason: string | null
  }
  formTexts: PhoneCodeFormTexts
  gate: { para?: string; next?: string; desde?: string }
  available: RetryDisplay
  hrefs: { verify: string; signIn: string; notNow: string | null }
}

// «Escribir el código»: a qué número se mandó —lo que la persona necesita confirmar—, el renglón, y
// si vino por la puerta, para qué acción es y la salida.
export function CodeEntryScreen({ number, texts, formTexts, gate, available, hrefs }: Props) {
  const [before, after] = texts.sentTo.split('{number}')
  return (
    <div className="flex flex-col">
      <h1 className="afiche text-2xl text-ink">{texts.title}</h1>
      <p className="mt-3 text-base text-ink">
        {before}
        <span className="font-medium tabular-nums">{number}</span>
        {after}
      </p>
      <LinkButton href={hrefs.verify} variant="ghost" className="mt-2 self-start">
        {texts.correct}
      </LinkButton>
      {texts.reason ? <p className="mt-2 text-sm text-ink-muted">{texts.reason}</p> : null}

      <div className="mt-8">
        <PhoneCodeForm
          texts={formTexts}
          gate={gate}
          available={available}
          verifyHref={hrefs.verify}
          signInHref={hrefs.signIn}
        />
      </div>

      {hrefs.notNow ? <NotNowLink href={hrefs.notNow} label={texts.notNow} /> : null}
    </div>
  )
}
