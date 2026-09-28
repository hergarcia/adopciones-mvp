import { cva } from 'class-variance-authority'
import { Card } from '@/components/ui/card'
import { LinkButton } from '@/components/ui/link-button'
import type { IdentityStatus } from '@/lib/verification/identity-status'
import { IdentityStamp } from './identity-stamp'
import { PhoneSectionLabel } from './phone-number-card'

export type IdentityStatusCardTexts = {
  label: string
  /** Solo en la oferta de nivel 2: lo que se gana, en voz de afiche. */
  headline?: string
  /** El sello del estado; nulo cuando no hay pedido. */
  stamp: string | null
  /** Ya elegidas según el nivel y el estado (FR-024), con sus fechas. */
  lines: string[]
  action: { label: string; href: string; variant: 'secondary' | 'ghost' } | null
  /** Sin nada que hacer todavía (sin teléfono), la primera línea también va en gris. */
  quiet?: boolean
}

type Props = {
  kind: IdentityStatus['kind']
  texts: IdentityStatusCardTexts
  /** Lo que se agrega al pie: el acceso a la cola para quien administra. */
  children?: React.ReactNode
}

const line = cva('', {
  variants: {
    role: {
      lead: 'text-base text-ink',
      quiet: 'text-base text-ink-muted',
      detail: 'mt-2 text-sm text-ink-muted',
    },
  },
})

function lineRole(index: number, quiet: boolean | undefined) {
  if (index > 0) return 'detail'
  return quiet ? 'quiet' : 'lead'
}

// «Tu identidad» en «Mi perfil», debajo de «Tu teléfono». La oferta de nivel 2 es el próximo paso de
// confianza y no un dato más como el correo: va pegada con cinta y dice lo que se gana en voz de
// afiche. Todo en `secondary` o `ghost`: la tirita de la pantalla sigue siendo «Editar mi perfil».
// El nivel se dice una sola vez: en nivel 2 lo dice esta sección y la del teléfono se calla (FR-024).
export function IdentityStatusCard({ kind, texts, children }: Props) {
  return (
    <Card taped={texts.headline !== undefined}>
      <PhoneSectionLabel>{texts.label}</PhoneSectionLabel>
      {texts.headline ? <p className="afiche mb-2 text-xl text-ink">{texts.headline}</p> : null}
      {texts.stamp ? (
        <div className="mt-2 mb-3">
          <IdentityStamp kind={kind} label={texts.stamp} />
        </div>
      ) : null}
      {texts.lines.map((text, index) => (
        <p key={text} className={line({ role: lineRole(index, texts.quiet) })}>
          {text}
        </p>
      ))}
      {texts.action ? (
        <LinkButton href={texts.action.href} variant={texts.action.variant} className="mt-4">
          {texts.action.label}
        </LinkButton>
      ) : null}
      {children}
    </Card>
  )
}
