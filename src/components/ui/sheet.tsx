'use client'

import * as Primitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/cn'
import { Backdrop, OverlayAction, OverlayClose, type OverlayState } from './overlay'

type Props = OverlayState & {
  /** Ya traducidos. */
  title: string
  closeLabel: string
  /** Las acciones. Las que además cierran van dentro de `SheetClose`. */
  children: React.ReactNode
  className?: string
}

export const SheetClose = OverlayAction

// Acciones secundarias y formularios cortos. De dónde entra lo decide el ancho de la pantalla, no
// quien la usa: desde abajo en el teléfono, desde el costado a partir de 768 (docs/10 §Componentes).
const panel = cn(
  'fixed overflow-y-auto border-ink bg-canvas p-6 shadow-float',
  'inset-x-0 bottom-0 max-h-[80dvh] border-t-2',
  'md:inset-x-auto md:inset-y-0 md:right-0 md:max-h-none md:w-full md:max-w-sheet md:border-t-0 md:border-l-2',
  'data-[state=open]:animate-[slide-up-in_var(--dur-base)_var(--ease-out)] data-[state=closed]:animate-[slide-down-out_var(--dur-base)_var(--ease-out)]',
  'md:data-[state=open]:animate-[slide-right-in_var(--dur-base)_var(--ease-out)] md:data-[state=closed]:animate-[slide-right-out_var(--dur-base)_var(--ease-out)]',
)

export function Sheet({
  title,
  closeLabel,
  trigger,
  open,
  onOpenChange,
  children,
  className,
}: Props) {
  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Primitive.Trigger asChild>{trigger}</Primitive.Trigger> : null}
      <Primitive.Portal>
        <Backdrop />
        <Primitive.Content aria-describedby={undefined} className={cn(panel, className)}>
          <Primitive.Title className="afiche pr-11 text-2xl text-ink">{title}</Primitive.Title>
          <div className="mt-4 flex flex-col items-start gap-2">{children}</div>
          <OverlayClose label={closeLabel} className="top-4 right-4" />
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  )
}
