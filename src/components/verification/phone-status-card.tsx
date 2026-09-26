import { Card } from '@/components/ui/card'
import { LinkButton } from '@/components/ui/link-button'
import type { PhoneStatus } from '@/lib/verification/phone-status'
import { CancelPendingButton } from './cancel-pending-button'
import { NumberLostNotice } from './number-lost-notice'
import { PhoneNumberCard, type PhoneNumberCardTexts } from './phone-number-card'

export type PhoneStatusCardTexts = {
  label: string
  card: PhoneNumberCardTexts
  change: string
  finish: string
  correct: string
  /** Ya elegido según sea la primera verificación o un cambio. */
  cancel: string
  noneValue: string
  noneBody: string
  noneAction: string
  /** Solo si otra cuenta se quedó con el número: los textos del aviso, ya con el día. */
  lost: { stamp: string; body: string; short: string } | null
}

type Props = {
  status: PhoneStatus
  texts: PhoneStatusCardTexts
  hrefs: { verify: string; code: string; self: string }
}

// Sin teléfono es el paso pendiente y no un hueco; no es un `EmptyState`, que centra y lleva
// ilustración: es una sección más del perfil. La tirita de la pantalla sigue siendo «Editar mi
// perfil», así que acá todo va en `secondary` o `ghost`.
export function PhoneStatusCard({ status, texts, hrefs }: Props) {
  switch (status.kind) {
    case 'verified':
      return (
        <PhoneNumberCard status={status} texts={texts.card} label={texts.label}>
          <LinkButton href={hrefs.verify} variant="ghost" className="mt-3">
            {texts.change}
          </LinkButton>
        </PhoneNumberCard>
      )
    case 'pending':
    case 'pending_change': {
      const card = (
        <PhoneNumberCard
          status={status}
          texts={texts.card}
          label={texts.lost ? undefined : texts.label}
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
        </PhoneNumberCard>
      )
      // Dos estados, dos sellos: el número perdido arriba y el nuevo, que espera el código, abajo.
      if (!texts.lost) return card
      return (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-muted">{texts.label}</p>
          <NumberLostNotice texts={{ stamp: texts.lost.stamp, text: texts.lost.short }} />
          {card}
        </div>
      )
    }
    default:
      if (texts.lost) {
        return (
          <Card>
            <p className="mb-3 text-sm text-ink-muted">{texts.label}</p>
            <NumberLostNotice texts={{ stamp: texts.lost.stamp, text: texts.lost.body }}>
              <LinkButton href={hrefs.verify} variant="secondary" className="mt-4">
                {texts.noneAction}
              </LinkButton>
            </NumberLostNotice>
          </Card>
        )
      }
      return (
        <Card>
          <p className="text-sm text-ink-muted">{texts.label}</p>
          <p className="mt-1 text-base text-ink">{texts.noneValue}</p>
          <p className="mt-2 text-sm text-ink-muted">{texts.noneBody}</p>
          <LinkButton href={hrefs.verify} variant="secondary" className="mt-4">
            {texts.noneAction}
          </LinkButton>
        </Card>
      )
  }
}
