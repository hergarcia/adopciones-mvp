'use client'

import * as Primitive from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { CloseIcon } from './icons'

// Entra deslizando desde abajo, sale con fade (docs/10 §Componentes). El mismo verbo que el botón
// que lo disparó: «Publicar» → «Publicado».
const toast = cva(
  'flex items-center justify-between gap-3 rounded-card border p-4 text-base shadow-float data-[state=closed]:animate-[fade-out_var(--dur-base)_var(--ease-out)] data-[state=open]:animate-[slide-up-in_var(--dur-base)_var(--ease-out)]',
  {
    variants: {
      variant: {
        success: 'border-primary bg-primary-soft text-ink',
        error: 'border-accent bg-accent-soft text-ink',
      },
    },
    defaultVariants: { variant: 'success' },
  },
)

export type ToastVariant = NonNullable<VariantProps<typeof toast>['variant']>

type Props = {
  /** Ya traducido. */
  message: string
  closeLabel: string
  variant?: ToastVariant
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}

// El provider va en la hoja que dispara avisos, no en el layout: una primitiva no monta contexto
// global por su cuenta.
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <Primitive.Provider swipeDirection="down" duration={4000}>
      {children}
      <Primitive.Viewport className="fixed inset-x-4 bottom-4 z-10 flex flex-col gap-2" />
    </Primitive.Provider>
  )
}

export function Toast({ message, closeLabel, variant, open, onOpenChange, className }: Props) {
  return (
    <Primitive.Root
      open={open}
      onOpenChange={onOpenChange}
      className={cn(toast({ variant }), className)}
    >
      <Primitive.Description>{message}</Primitive.Description>
      <Primitive.Close
        aria-label={closeLabel}
        className="press inline-flex size-11 shrink-0 items-center justify-center rounded-control text-ink-muted hover:text-ink"
      >
        <CloseIcon />
      </Primitive.Close>
    </Primitive.Root>
  )
}
