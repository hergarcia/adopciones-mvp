import { LinkButton } from '@/components/ui/link-button'
import { formatPhoneNumber } from '@/lib/verification/phone-number'
import type { PhoneStatus } from '@/lib/verification/phone-status'
import type { RetryDisplay } from '@/lib/verification/retry-at'
import { CancelPendingButton } from './cancel-pending-button'
import { NotNowLink } from './not-now-link'
import { PhoneNumberCard, type PhoneNumberCardTexts } from './phone-number-card'
import { PhoneNumberForm, type PhoneNumberFormTexts } from './phone-number-form'
import { PhonePrivacyNotice } from './phone-privacy-notice'
import { VerifyHeading } from './verify-heading'

export type VerifyPhoneScreenTexts = {
  title: string
  lead: string
  titlePending: string
  titleVerified: string
  numberLabelNew: string
  finish: string
  /** Ya elegido según sea la primera verificación o un cambio. */
  cancel: string
  correctTitle: string
  changeTitle: string
  changeWarning: string
  notNow: string
  privacy: { private: string; revealed: string }
  card: PhoneNumberCardTexts
  /** El encabezado del aviso, cuando se llegó por la puerta de una acción. */
  gate: { title: string; lead: string } | null
}

type Props = {
  status: PhoneStatus
  texts: VerifyPhoneScreenTexts
  formTexts: PhoneNumberFormTexts
  available: RetryDisplay
  hrefs: {
    code: string
    signIn: string
    /** Esta pantalla con su puerta: la vuelta después de cancelar. */
    self: string
    /** «Ahora no», solo cuando se llegó por la puerta. */
    notNow: string | null
  }
}

// Una sola tirita, la del próximo paso real: pedir el código si no hay nada a medias, terminar si
// lo hay.
export function VerifyPhoneScreen({ status, texts, formTexts, available, hrefs }: Props) {
  const privacy = <PhonePrivacyNotice {...texts.privacy} />
  const form = (overrides: { isPrimary: boolean; label?: string; initialNumber?: string }) => (
    <PhoneNumberForm
      texts={{ ...formTexts, label: overrides.label ?? formTexts.label }}
      isPrimary={overrides.isPrimary}
      {...(overrides.initialNumber === undefined ? {} : { initialNumber: overrides.initialNumber })}
      available={available}
      codeHref={hrefs.code}
      signInHref={hrefs.signIn}
    >
      {privacy}
    </PhoneNumberForm>
  )

  const heading = (title: string, lead: string | null = null) => (
    <VerifyHeading texts={texts.gate ?? { title, lead }} />
  )

  return (
    <div className="flex flex-col">
      {status.kind === 'none' ? (
        <>
          {heading(texts.title, texts.lead)}
          <div className="mt-8">{form({ isPrimary: true })}</div>
        </>
      ) : null}

      {status.kind === 'pending' || status.kind === 'pending_change' ? (
        <>
          {heading(texts.titlePending)}
          <div className="mt-8">
            <PhoneNumberCard status={status} texts={texts.card} />
          </div>
          <div className="mt-6 flex flex-col items-start gap-3">
            <LinkButton href={hrefs.code} variant="tirita" size="lg" className="w-full">
              {texts.finish}
            </LinkButton>
            <CancelPendingButton from={hrefs.self} label={texts.cancel} />
          </div>
          <h2 className="mt-10 text-lg font-bold text-ink">{texts.correctTitle}</h2>
          <div className="mt-4">
            {form({ isPrimary: false, initialNumber: formatPhoneNumber(status.number) })}
          </div>
        </>
      ) : null}

      {status.kind === 'verified' ? (
        <>
          {heading(texts.titleVerified)}
          <div className="mt-8">
            <PhoneNumberCard status={status} texts={texts.card} />
          </div>
          <h2 className="mt-10 text-lg font-bold text-ink">{texts.changeTitle}</h2>
          <p className="mt-2 text-sm text-ink-muted">{texts.changeWarning}</p>
          <div className="mt-4">{form({ isPrimary: true, label: texts.numberLabelNew })}</div>
        </>
      ) : null}

      {hrefs.notNow ? <NotNowLink href={hrefs.notNow} label={texts.notNow} /> : null}
    </div>
  )
}
