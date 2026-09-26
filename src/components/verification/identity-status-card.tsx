import { Card } from '@/components/ui/card'
import { LinkButton } from '@/components/ui/link-button'
import type { IdentityStatus } from '@/lib/verification/identity-status'
import { IdentityStamp } from './identity-stamp'
import { PhoneSectionLabel } from './phone-number-card'

export type IdentityStatusCardTexts = {
  label: string
  /** El sello del estado; nulo cuando no hay pedido. */
  stamp: string | null
  /** Ya elegidas según el nivel y el estado (FR-024), con sus fechas. */
  lines: string[]
  action: { label: string; href: string; variant: 'secondary' | 'ghost' } | null
}

type Props = {
  kind: IdentityStatus['kind']
  texts: IdentityStatusCardTexts
  /** Lo que se agrega al pie: el acceso a la cola para quien administra. */
  children?: React.ReactNode
}

// «Tu identidad» en «Mi perfil», debajo de «Tu teléfono» y con la misma forma. Todo en `secondary`
// o `ghost`: la tirita de la pantalla sigue siendo «Editar mi perfil». El nivel se dice una sola
// vez: en nivel 2 lo dice esta sección y la del teléfono se calla (FR-024).
export function IdentityStatusCard({ kind, texts, children }: Props) {
  return (
    <Card>
      <PhoneSectionLabel>{texts.label}</PhoneSectionLabel>
      {texts.stamp ? (
        <div className="mt-2 mb-3">
          <IdentityStamp kind={kind} label={texts.stamp} />
        </div>
      ) : null}
      {texts.lines.map((line, index) => (
        <p
          key={line}
          className={index === 0 ? 'text-base text-ink' : 'mt-2 text-sm text-ink-muted'}
        >
          {line}
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
