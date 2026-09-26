import { LinkButton } from '@/components/ui/link-button'
import type { IdentityStatus } from '@/lib/verification/identity-status'
import { IdentityStamp } from './identity-stamp'
import { SupportSentence } from './support-sentence'
import { WithdrawRequestDialog, type WithdrawTexts } from './withdraw-request-dialog'

export type IdentityStatusViewTexts = {
  title: string
  stamp: string
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
  hrefs: { back: string; withdrawn: string }
}

// El estado del pedido (§Pantallas, Estado de mi pedido). Lo que llama la atención es el sello y,
// si hay algo que hacer, la tirita; sin nada que hacer, volver al perfil es la única salida.
export function IdentityStatusView({ kind, texts, supportEmail, hrefs }: Props) {
  return (
    <div className="flex flex-col">
      <h1 className="afiche text-2xl text-ink">{texts.title}</h1>
      <div className="mt-5">
        <IdentityStamp kind={kind} label={texts.stamp} />
      </div>

      <div className="mt-5 flex flex-col gap-3 text-base text-ink">
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

      <div className="mt-8 flex flex-col items-start gap-3">
        {texts.withdraw ? (
          <WithdrawRequestDialog texts={texts.withdraw} doneHref={hrefs.withdrawn} />
        ) : null}
        <LinkButton
          href={hrefs.back}
          variant={kind === 'approved' && texts.action === null ? 'secondary' : 'ghost'}
        >
          {texts.back}
        </LinkButton>
      </div>
    </div>
  )
}
