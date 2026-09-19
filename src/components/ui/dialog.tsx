'use client'

import * as Primitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/cn'
import { Backdrop, OverlayAction, OverlayClose, type OverlayState } from './overlay'

type Props = OverlayState & {
  /** Todo ya traducido: una primitiva no sabe de idiomas (docs/08 §i18n en componentes). */
  title: string
  description?: string
  closeLabel: string
  /** Las acciones. Las que además cierran van dentro de `DialogClose`. */
  children: React.ReactNode
  className?: string
}

export const DialogClose = OverlayAction

// Solo confirmaciones irreversibles (docs/10 §Componentes). La cinta va en un div interno: `.cinta`
// fija `position: relative`, y el contenedor tiene que seguir siendo `fixed`.
export function Dialog({
  title,
  description,
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
        <Primitive.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cn(
            'fixed top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-[var(--measure)] -translate-x-1/2 -translate-y-1/2',
            'data-[state=closed]:animate-[fade-out_var(--dur-base)_var(--ease-out)] data-[state=open]:animate-[fade-in_var(--dur-base)_var(--ease-out)]',
            className,
          )}
        >
          <div className="cinta border-2 border-ink bg-canvas p-6 shadow-float">
            <Primitive.Title className="afiche pr-11 text-2xl text-ink">{title}</Primitive.Title>
            {description ? (
              <Primitive.Description className="mt-2 text-base text-ink-muted">
                {description}
              </Primitive.Description>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">{children}</div>
            <OverlayClose label={closeLabel} className="top-2 right-2" />
          </div>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  )
}
