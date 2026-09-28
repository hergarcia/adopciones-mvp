import { LinkButton } from '@/components/ui/link-button'
import { stepHref } from '@/lib/vouches/paths'
import type { VouchSlot as Slot } from '@/lib/vouches/vouch-slot'
import { VouchAction } from './vouch-action'
import { VouchPausedNote } from './vouch-paused-note'
import type { VouchSheetTexts } from './vouch-sheet'

export type VouchSlotTexts = {
  vouch: string
  canVouchHint: string
  vouching: string
  withdraw: string
  reciprocal: string
  blocked: string
  cannotReceive: string
  needsLevelTwo: string
  inReview: string
  restoresLevelTwo: string
  paused: { mine: string; theirs: string; both: string }
  steps: { complete_profile: string; verify_phone: string; verify_identity: string }
  giveSheet: VouchSheetTexts
  withdrawSheet: VouchSheetTexts
}

type Props = {
  slot: Slot
  texts: VouchSlotTexts
  publicId: string
  /** El perfil que se mira: a donde vuelven ingresar, el paso que falta y la acción. */
  returnPath: string
  signInHref: string
  /** Después de un aval que no se dio por un motivo de FR-013: el motivo de hoy se anuncia. */
  announce: boolean
}

function Sentence({ text, announce }: { text: string; announce: boolean }) {
  const className = 'text-base text-ink-muted'
  return announce ? (
    <output className={className}>{text}</output>
  ) : (
    <p className={className}>{text}</p>
  )
}

// Lo que ve quien mira debajo del perfil, ya decidido por `vouchSlot` (FR-011): acá solo se traduce
// a la pantalla. La tirita aparece solo cuando avalar es el próximo paso real; sin sesión es
// `secondary`, porque casi todas las visitas sin sesión son de quien adopta.
export function VouchSlot({ slot, texts, publicId, returnPath, signInHref, announce }: Props) {
  switch (slot.kind) {
    case 'none':
      return null
    case 'sign_in':
      return (
        <LinkButton href={signInHref} variant="secondary" className="self-start">
          {texts.vouch}
        </LinkButton>
      )
    case 'can_vouch':
      return (
        <div className="flex flex-col gap-2">
          <VouchAction
            verb="give"
            publicId={publicId}
            returnPath={returnPath}
            trigger={{ label: texts.vouch, variant: 'tirita' }}
            texts={texts.giveSheet}
          />
          <p className="text-sm text-ink-muted">{texts.canVouchHint}</p>
        </div>
      )
    case 'vouching':
    case 'vouching_paused':
      return (
        <div className="flex flex-col items-start gap-2">
          <p className="text-base text-ink">{texts.vouching}</p>
          {slot.kind === 'vouching_paused' ? (
            <VouchPausedNote text={texts.paused[slot.mark]} />
          ) : null}
          <VouchAction
            verb="withdraw"
            publicId={publicId}
            returnPath={returnPath}
            trigger={{ label: texts.withdraw, variant: 'ghost' }}
            texts={texts.withdrawSheet}
          />
        </div>
      )
    case 'reciprocal':
      return <Sentence text={texts.reciprocal} announce={announce} />
    case 'blocked':
      return <Sentence text={texts.blocked} announce={announce} />
    case 'cannot_receive':
      return <Sentence text={texts.cannotReceive} announce={announce} />
    default: {
      const { step } = slot
      const href = stepHref(step, returnPath)
      return (
        <div className="flex flex-col items-start gap-3">
          <Sentence
            text={step.kind === 'identity_in_review' ? texts.inReview : texts.needsLevelTwo}
            announce={announce}
          />
          {step.kind === 'verify_phone' && step.restoresLevelTwo ? (
            <p className="text-sm text-ink-muted">{texts.restoresLevelTwo}</p>
          ) : null}
          {href === null || step.kind === 'identity_in_review' ? null : (
            <LinkButton href={href} variant="secondary">
              {texts.steps[step.kind]}
            </LinkButton>
          )}
        </div>
      )
    }
  }
}
