import { Card } from '@/components/ui/card'
import { LinkButton } from '@/components/ui/link-button'
import { formatPhoneNumber } from '@/lib/verification/phone-number'
import type { PhoneStatus } from '@/lib/verification/phone-status'
import { CancelPendingButton } from './cancel-pending-button'
import { PendingPhoneNotice } from './pending-phone-notice'
import { VerifiedPhone } from './verified-phone'

export type PhoneStatusCardTexts = {
  verifiedStamp: string
  /** "Nivel 1 desde el …", ya con la fecha; solo con el teléfono verificado. */
  levelSince: string | null
  change: string
  pendingStamp: string
  pendingBody: string
  /** Con `{number}` adentro. */
  pendingRestores: string
  finish: string
  correct: string
  cancel: string
  noneTitle: string
  noneBody: string
  noneAction: string
}

type Props = {
  status: PhoneStatus
  texts: PhoneStatusCardTexts
  hrefs: { verify: string; code: string; self: string }
}

// La sección de teléfono de «Mi perfil» (FR-018). Sin teléfono muestra el paso pendiente en vez
// de un hueco; no es un `EmptyState`, que centra y lleva ilustración: es una sección más del
// perfil. La tirita de la pantalla sigue siendo «Editar mi perfil», así que acá todo va en
// `secondary` o `ghost`.
export function PhoneStatusCard({ status, texts, hrefs }: Props) {
  switch (status.kind) {
    case 'verified':
      return (
        <VerifiedPhone
          number={formatPhoneNumber(status.number)}
          texts={{ stamp: texts.verifiedStamp, levelSince: texts.levelSince ?? '' }}
        >
          <LinkButton href={hrefs.verify} variant="ghost" className="mt-3">
            {texts.change}
          </LinkButton>
        </VerifiedPhone>
      )
    case 'pending':
    case 'pending_change':
      return (
        <PendingPhoneNotice
          number={formatPhoneNumber(status.number)}
          texts={{
            stamp: texts.pendingStamp,
            body: texts.pendingBody,
            ...(status.kind === 'pending_change'
              ? {
                  restores: texts.pendingRestores.replace(
                    '{number}',
                    formatPhoneNumber(status.previous.number),
                  ),
                }
              : {}),
          }}
        >
          <div className="mt-4 flex flex-col items-start gap-3">
            <LinkButton href={hrefs.code} variant="secondary">
              {texts.finish}
            </LinkButton>
            <LinkButton href={hrefs.verify} variant="ghost">
              {texts.correct}
            </LinkButton>
            <CancelPendingButton from={hrefs.self} label={texts.cancel} />
          </div>
        </PendingPhoneNotice>
      )
    default:
      return (
        <Card>
          <h2 className="text-lg font-bold text-ink">{texts.noneTitle}</h2>
          <p className="mt-2 text-sm text-ink-muted">{texts.noneBody}</p>
          <LinkButton href={hrefs.verify} variant="secondary" className="mt-4">
            {texts.noneAction}
          </LinkButton>
        </Card>
      )
  }
}
