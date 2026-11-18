'use client'

import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import type { PetStatusFailure, StatusFlow } from '@/hooks/use-pet-status'
import { stateDroppedBy } from '@/lib/stamps/drop'
import { PetStatusFailureStrip } from './pet-status-feedback'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Mientras una acción corre, la hoja no se cierra ni se abre. */
  busy: boolean
  /** Ya traducidos: el nombre del animal es el título y «Más acciones» lo que la abre. */
  texts: { name: string; more: string; close: string }
  children: React.ReactNode
}

// Las acciones de un animal en «Mis animales», en un `Sheet`: cinco botones no entran debajo de una
// card de 175 px (docs/10 §Layout, research R10). Se abre con «Más acciones».
export function PetStatusSheet({ open, onOpenChange, busy, texts, children }: Props) {
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => (busy ? undefined : onOpenChange(next))}
      title={texts.name}
      closeLabel={texts.close}
      trigger={
        <Button variant="ghost" size="sm">
          {texts.more}
        </Button>
      }
    >
      {children}
    </Sheet>
  )
}

type CardProps<A extends string> = Omit<Props, 'busy' | 'texts'> & {
  flow: StatusFlow<A>
  /** La acción que va a la vista, si hay una. */
  lead: React.ReactNode
  /** «Ver ficha», «Compartir» y lo que va antes de «Más acciones». */
  links: React.ReactNode
  texts: Props['texts'] & { failures: Record<PetStatusFailure, Record<A, string>> }
}

/**
 * Las acciones debajo de una card de un animal o una camada: la que va a la vista, lo que no llegó
 * mientras la hoja está cerrada, los enlaces y «Más acciones» con el resto.
 */
export function StatusCard<A extends string>({
  flow,
  lead,
  links,
  open,
  onOpenChange,
  texts,
  children,
}: CardProps<A>) {
  return (
    <div
      className="flex w-full flex-col items-start gap-3"
      data-cae={stateDroppedBy(flow.landed) ?? undefined}
    >
      {lead}
      {open ? null : <PetStatusFailureStrip flow={flow} failures={texts.failures} />}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {links}
        <PetStatusSheet
          open={open}
          onOpenChange={onOpenChange}
          busy={flow.busy !== null}
          texts={texts}
        >
          {children}
        </PetStatusSheet>
      </div>
    </div>
  )
}
