'use client'

import { OverlayAction, OverlayShell, type OverlayState } from './overlay'

type Props = OverlayState & {
  /** Ya traducidos. */
  title: string
  closeLabel: string
  /** Las acciones. Las que además cierran van dentro de `SheetClose`. */
  children: React.ReactNode
  className?: string
}

export const SheetClose = OverlayAction

// Acciones secundarias y formularios cortos (docs/10 §Componentes).
export function Sheet({ trigger, open, onOpenChange, ...layerProps }: Props) {
  return (
    <OverlayShell trigger={trigger} open={open} onOpenChange={onOpenChange}>
      {({ SheetLayer }, control) => <SheetLayer {...control} {...layerProps} />}
    </OverlayShell>
  )
}
