'use client'

import * as Primitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { CloseIcon } from './icons'

// Acciones secundarias y formularios cortos. En el teléfono entra desde abajo; desde 768 entra
// desde el costado (docs/10 §Componentes). Los keyframes viven en globals.css.
const panel = cva(
  'fixed bg-canvas shadow-float data-[state=closed]:animate-[fade-out_var(--dur-base)_var(--ease-out)] data-[state=open]:animate-[fade-in_var(--dur-base)_var(--ease-out)]',
  {
    variants: {
      side: {
        bottom:
          'inset-x-0 bottom-0 max-h-[80dvh] rounded-t-card p-6 data-[state=closed]:animate-[slide-down-out_var(--dur-base)_var(--ease-out)] data-[state=open]:animate-[slide-up-in_var(--dur-base)_var(--ease-out)]',
        side: 'inset-y-0 right-0 w-full max-w-sm p-6 data-[state=closed]:animate-[slide-right-out_var(--dur-base)_var(--ease-out)] data-[state=open]:animate-[slide-right-in_var(--dur-base)_var(--ease-out)]',
      },
    },
    defaultVariants: { side: 'bottom' },
  },
)

type Props = VariantProps<typeof panel> & {
  title: string
  closeLabel: string
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Sheet({ side, title, closeLabel, trigger, children, className }: Props) {
  return (
    <Primitive.Root>
      <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Overlay className="fixed inset-0 bg-ink/40 data-[state=closed]:animate-[fade-out_var(--dur-base)_var(--ease-out)] data-[state=open]:animate-[fade-in_var(--dur-base)_var(--ease-out)]" />
        <Primitive.Content className={cn(panel({ side }), className)}>
          <Primitive.Title className="text-xl font-bold tracking-tight text-ink">
            {title}
          </Primitive.Title>
          <div className="mt-4 flex flex-col gap-2">{children}</div>
          <Primitive.Close
            aria-label={closeLabel}
            className="press absolute top-4 right-4 inline-flex size-11 items-center justify-center rounded-control text-ink-muted hover:text-ink"
          >
            <CloseIcon />
          </Primitive.Close>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  )
}
