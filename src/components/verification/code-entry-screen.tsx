import { LinkButton } from '@/components/ui/link-button'
import type { RetryDisplay } from '@/lib/verification/retry-at'
import { NotNowLink } from './not-now-link'
import { PhoneCodeForm, type PhoneCodeFormTexts } from './phone-code-form'
import { VerifyHeading } from './verify-heading'

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
  hrefs: { verify: string; inUse: string; signIn: string; notNow: string | null }
}

export function CodeEntryScreen({ number, texts, formTexts, gate, available, hrefs }: Props) {
  // La frase está entera en los mensajes; se parte solo para marcar el número, que es lo que la
  // persona necesita confirmar.
  const [before, after] = texts.sentTo.split('{number}')
  return (
    <div className="flex flex-col">
      <PhoneCodeForm
        header={
          <>
            <VerifyHeading texts={{ title: texts.title, lead: null }} />
            <p className="mt-3 text-base text-ink">
              {before}
              <span className="font-medium tabular-nums">{number}</span>
              {after}
            </p>
            <LinkButton href={hrefs.verify} variant="ghost" className="mt-2 self-start">
              {texts.correct}
            </LinkButton>
            {texts.reason ? <p className="mt-2 text-sm text-ink-muted">{texts.reason}</p> : null}
          </>
        }
        texts={formTexts}
        gate={gate}
        available={available}
        inUseHref={hrefs.inUse}
        signInHref={hrefs.signIn}
      />

      {hrefs.notNow ? <NotNowLink href={hrefs.notNow} label={texts.notNow} /> : null}
    </div>
  )
}
