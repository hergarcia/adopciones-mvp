import { cva } from 'class-variance-authority'
import { LinkButton } from '@/components/ui/link-button'
import type { IdentityStatus } from '@/lib/verification/identity-status'
import { IdentityStamp } from './identity-stamp'
import { SupportSentence } from './support-sentence'
import { WithdrawRequestDialog, type WithdrawTexts } from './withdraw-request-dialog'

export type IdentityStatusViewTexts = {
  title: string
  stamp: string
  /** Lo que se ganó, en voz de afiche: solo aprobado y en nivel 2. */
  payoff: { title: string; body: string } | null
  /** Lo que dice cada estado, ya con sus fechas; una línea puede traer `{email}`. */
  lines: string[]
  back: string
  /** La tirita, cuando hay algo que hacer: pedir de nuevo, verificar el teléfono. */
  action: { label: string; href: string } | null
  /** Solo en revisión. */
  withdraw: WithdrawTexts | null
}

type Props = {
  kind: Exclude<IdentityStatus['kind'], 'none'>
  texts: IdentityStatusViewTexts
  supportEmail: string
  hrefs: { back: string; withdrawn: string; notWithdrawn: string }
  /** La chapita del nivel de hoy, junto al pago; nada sin nivel (FR-023). */
  badge?: React.ReactNode
}

type Emphasis = 'payoff' | 'plain'

const stampSpacing = cva('', {
  variants: { emphasis: { payoff: 'mt-8', plain: 'mt-5' } },
})

// En el pago, las fechas pasan a segundo plano; en el resto, son lo que dice el estado.
const lines = cva('mt-5 flex flex-col', {
  variants: {
    emphasis: {
      payoff: 'gap-2 text-sm text-ink-muted',
      plain: 'gap-3 text-base text-ink',
    },
  },
})

// El estado del pedido (§Pantallas, Estado de mi pedido). Lo que llama la atención es el sello y,
// si hay algo que hacer, la tirita; sin nada que hacer, volver al perfil es la única salida. Aprobado
// es el pago del paso más pesado del producto (docs/03 §Hipótesis): el sello grande y el nivel en
// voz de afiche, y las fechas pasan a segundo plano. La chapita es la que dice el logro, así que el
// sello queda en `md`: dos marcas grandes competirían.
export function IdentityStatusView({ kind, texts, supportEmail, hrefs, badge }: Props) {
  const isPayoff = texts.payoff !== null
  const emphasis: Emphasis = isPayoff ? 'payoff' : 'plain'
  return (
    <div className="flex flex-col">
      <h1 className="afiche text-2xl text-ink">{texts.title}</h1>
      <div className={stampSpacing({ emphasis })}>
        <IdentityStamp kind={kind} label={texts.stamp} size={isPayoff && !badge ? 'lg' : 'md'} />
      </div>

      {texts.payoff ? (
        <div className="mt-8 flex items-center gap-4">
          {badge}
          <div>
            <p className="afiche text-xl text-ink">{texts.payoff.title}</p>
            <p className="mt-2 text-base text-ink">{texts.payoff.body}</p>
          </div>
        </div>
      ) : null}

      <div className={lines({ emphasis })}>
        {texts.lines.map((line) => (
          <p key={line} className="tabular-nums">
            <SupportSentence template={line} email={supportEmail} />
          </p>
        ))}
      </div>

      {texts.action ? (
        <LinkButton href={texts.action.href} variant="tirita" size="lg" className="mt-10">
          {texts.action.label}
        </LinkButton>
      ) : null}

      {/* Las salidas en el orden de las de la cuenta: la neutra primero, la que tira el pedido al
          final, a mano pero sin ser lo primero que ofrece la pantalla justo después de enviar. */}
      <div className="mt-8 flex flex-col items-start gap-3">
        <LinkButton
          href={hrefs.back}
          variant={kind === 'approved' && texts.action === null ? 'secondary' : 'ghost'}
        >
          {texts.back}
        </LinkButton>
        {texts.withdraw ? (
          <WithdrawRequestDialog
            texts={texts.withdraw}
            hrefs={{ withdrawn: hrefs.withdrawn, notWithdrawn: hrefs.notWithdrawn }}
          />
        ) : null}
      </div>
    </div>
  )
}
