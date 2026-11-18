'use client'

import { OverlayShell, type OverlayState } from './overlay'

type Props = OverlayState & {
  /** Todo ya traducido: una primitiva no sabe de idiomas (docs/08 §i18n en componentes). */
  title: string
  description?: string
  closeLabel: string
  /** Las acciones. Las que además cierran van dentro de `DialogClose` (`overlay-close.tsx`). */
  children: React.ReactNode
  className?: string
}

// Solo confirmaciones irreversibles (docs/10 §Componentes).
export function Dialog({ trigger, open, onOpenChange, ...layerProps }: Props) {
  return (
    <OverlayShell trigger={trigger} open={open} onOpenChange={onOpenChange}>
      {({ DialogLayer }, control) => <DialogLayer {...control} {...layerProps} />}
    </OverlayShell>
  )
}
