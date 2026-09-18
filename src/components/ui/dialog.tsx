'use client'

import * as Primitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/cn'
import { CloseIcon } from './icons'

type Props = {
  /** Todo ya traducido: una primitiva no sabe de idiomas (docs/08 §i18n en componentes). */
  title: string
  description?: string
  closeLabel: string
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
}

// Una nota pegada con cinta en el centro de la pantalla. Solo confirmaciones irreversibles
// (docs/10 §Componentes). Entra y sale con fade, desde los keyframes de globals.css enganchados a
// los atributos de estado de Radix. La cinta va en un div interno: `.cinta` fija
// `position: relative`, y el contenedor tiene que seguir siendo `fixed`.
export function Dialog({ title, description, closeLabel, trigger, children, className }: Props) {
  return (
    <Primitive.Root>
      <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Overlay className="fixed inset-0 bg-ink/40 data-[state=closed]:animate-[fade-out_var(--dur-base)_var(--ease-out)] data-[state=open]:animate-[fade-in_var(--dur-base)_var(--ease-out)]" />
        <Primitive.Content
          className={cn(
            'fixed top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-[var(--measure)] -translate-x-1/2 -translate-y-1/2',
            'data-[state=closed]:animate-[fade-out_var(--dur-base)_var(--ease-out)] data-[state=open]:animate-[fade-in_var(--dur-base)_var(--ease-out)]',
            className,
          )}
        >
          <div className="cinta border-2 border-ink bg-canvas p-6 shadow-float">
            <Primitive.Title className="afiche text-2xl text-ink">{title}</Primitive.Title>
            {description ? (
              <Primitive.Description className="mt-2 text-base text-ink-muted">
                {description}
              </Primitive.Description>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">{children}</div>
            <Primitive.Close
              aria-label={closeLabel}
              className="press absolute top-2 right-2 inline-flex size-11 items-center justify-center text-ink-muted hover:text-ink"
            >
              <CloseIcon />
            </Primitive.Close>
          </div>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  )
}
