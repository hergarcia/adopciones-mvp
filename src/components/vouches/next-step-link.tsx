import { LinkButton } from '@/components/ui/link-button'
import type { NextStep } from '@/lib/vouches/next-step'
import { stepHref } from '@/lib/vouches/paths'

export type NextStepLabels = {
  complete_profile: string
  verify_phone: string
  verify_identity: string
}

type Props = {
  step: NextStep
  /** A dónde vuelve quien completa el paso. */
  returnPath: string
  /** Ya traducidos. */
  labels: NextStepLabels
}

// El paso que falta para llegar a nivel 2, a un toque. Un pedido en revisión no tiene nada que tocar.
export function NextStepLink({ step, returnPath, labels }: Props) {
  const href = stepHref(step, returnPath)
  if (href === null || step.kind === 'identity_in_review') return null
  return (
    <LinkButton href={href} variant="secondary">
      {labels[step.kind]}
    </LinkButton>
  )
}
