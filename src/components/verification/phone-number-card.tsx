import { cva } from 'class-variance-authority'
import { Card } from '@/components/ui/card'
import { formatPhoneNumber } from '@/lib/verification/phone-number'
import type { PhoneStatus } from '@/lib/verification/phone-status'

export type PhoneNumberCardTexts = {
  verifiedStamp: string
  /** "Nivel 1 desde el …", ya con la fecha; solo con el teléfono verificado. */
  levelSince: string | null
  pendingStamp: string
  pendingBody: string
  /** Con `{number}`: el verificado que vuelve si se cancela el cambio. */
  pendingChangeBody: string
}

type Props = {
  status: Exclude<PhoneStatus, { kind: 'none' }>
  texts: PhoneNumberCardTexts
  /** «Tu teléfono», donde no hay un título arriba que ya lo nombre. */
  label?: string
  /** Una línea arriba del número: lo que le pasó al número anterior. */
  notice?: React.ReactNode
  children?: React.ReactNode
}

// Mate cocido en el sello a medias porque le toca actuar a la persona; yerba cuando ya está.
const stamp = cva('sello text-sm', {
  variants: { tone: { verified: 'text-primary', pending: 'text-warning' } },
})
const note = cva('mt-2 text-sm', {
  variants: { tone: { verified: 'text-ink-muted', pending: 'text-ink' } },
})

// El estado es un sello porque es eso, un estado que cambia; la chapita de cada nivel llega con la
// historia #12, y acá el nivel se dice en texto. El número anterior de un cambio no se muestra
// como verificado mientras la cuenta está sin verificar: solo se dice que vuelve (FR-018).
export function PhoneNumberCard({ status, texts, label, notice, children }: Props) {
  const tone = status.kind === 'verified' ? 'verified' : 'pending'
  return (
    <Card>
      {label ? <PhoneSectionLabel>{label}</PhoneSectionLabel> : null}
      {notice ? <p className="mb-3 text-sm text-ink">{notice}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-medium text-ink tabular-nums">
          {formatPhoneNumber(status.number)}
        </p>
        <span className={stamp({ tone })}>
          {tone === 'verified' ? texts.verifiedStamp : texts.pendingStamp}
        </span>
      </div>
      <p className={note({ tone })}>{noteText(status, texts)}</p>
      {children}
    </Card>
  )
}

function noteText(status: Props['status'], texts: PhoneNumberCardTexts): string {
  switch (status.kind) {
    case 'verified':
      return texts.levelSince ?? ''
    case 'pending':
      return texts.pendingBody
    default:
      return texts.pendingChangeBody.replace('{number}', formatPhoneNumber(status.previous.number))
  }
}

/** «Tu teléfono»: la etiqueta de la sección, igual en todos sus estados. */
export function PhoneSectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-sm text-ink-muted">{children}</p>
}
