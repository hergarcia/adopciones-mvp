'use client'

import {
  EndAdoptionDialog,
  type EndAdoptionTexts,
} from '@/components/adoptions/end-adoption-dialog'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import type { PetStatusFailure, StatusFlow } from '@/hooks/use-pet-status'
import { PetStatusFailureStrip } from './pet-status-feedback'

export type StatusLook = 'tirita' | 'lead' | 'plain' | 'small'

const LOOKS = {
  tirita: { variant: 'tirita', size: 'lg', className: 'md:w-auto' },
  lead: { variant: 'secondary', size: 'sm', className: undefined },
  plain: { variant: 'secondary', size: 'md', className: undefined },
  small: { variant: 'secondary', size: 'sm', className: undefined },
} as const

/** La acción que pide confirmar que una adopción termina, con su texto (#67). */
export type EndAdoptionStep<A extends string> = { action: A; texts: EndAdoptionTexts } | null

type ButtonProps<A extends string> = {
  /** «Marcar adoptado» no corre acá: lleva a «¿A quién se lo diste?» (#67, R8). */
  handoverHref: string
  endAdoption: EndAdoptionStep<A>
  flow: StatusFlow<A>
  action: A
  label: string
  look: StatusLook
}

/** Un botón de estado: lleva a entregar, pide confirmar el fin de una adopción o corre la acción. */
export function StatusButton<A extends string>({
  handoverHref,
  endAdoption,
  flow,
  action,
  label,
  look,
}: ButtonProps<A>) {
  const { variant, size, className } = LOOKS[look]
  if (action === 'mark_adopted') {
    return flow.busy === null ? (
      <LinkButton href={handoverHref} variant={variant} size={size} className={className}>
        {label}
      </LinkButton>
    ) : (
      <Button variant={variant} size={size} className={className} disabled>
        {label}
      </Button>
    )
  }
  const loading = flow.busy === action
  const disabled = flow.busy !== null && flow.busy !== action
  if (endAdoption?.action === action) {
    return (
      <EndAdoptionDialog
        trigger={{ label, variant, size, className, loading, disabled }}
        texts={endAdoption.texts}
        onConfirm={() => void flow.run(action)}
      />
    )
  }
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      loading={loading}
      disabled={disabled}
      onClick={() => void flow.run(action)}
    >
      {label}
    </Button>
  )
}

type Props<A extends string> = {
  flow: StatusFlow<A>
  actions: readonly A[]
  labels: Record<A, string>
  /** Cada una nombra el botón que se tocó: «Tocá «Pausar» de nuevo». */
  failures: Record<PetStatusFailure, Record<A, string>>
  lookOf: (action: A) => StatusLook
  handoverHref: string
  endAdoption: EndAdoptionStep<A>
  /** Con la hoja cerrada, el aviso de lo que no llegó va afuera, junto a lo que queda a la vista. */
  showFailure?: boolean
}

// Una lista de acciones de estado con un solo flujo (research R10 de la #206): la de un animal, la de
// una cría o la de una camada. Mientras una corre, las demás esperan y un segundo toque no hace nada
// (FR-007).
export function StatusActionList<A extends string>({
  flow,
  actions,
  labels,
  failures,
  lookOf,
  handoverHref,
  endAdoption,
  showFailure = true,
}: Props<A>) {
  return (
    <>
      {showFailure ? <PetStatusFailureStrip flow={flow} failures={failures} /> : null}
      {actions.map((action) => (
        <StatusButton
          key={action}
          handoverHref={handoverHref}
          endAdoption={endAdoption}
          flow={flow}
          action={action}
          label={labels[action]}
          look={lookOf(action)}
        />
      ))}
    </>
  )
}
