'use client'

import * as Primitive from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { CloseIcon } from './icons'
import { closeButton } from './overlay'

// La banda de la izquierda dice cómo salió: yerba si bien, ceibo si no. El mensaje usa el mismo
// verbo que el botón que lo disparó: «Publicar» → «Publicado» (docs/10 §Componentes).
const toast = cva(
  'flex items-center justify-between gap-3 border-2 border-l-8 border-ink bg-canvas p-4 text-base font-medium text-ink shadow-float data-[state=closed]:animate-[fade-out_var(--dur-base)_var(--ease-out)] data-[state=open]:animate-[slide-up-in_var(--dur-base)_var(--ease-out)]',
  {
    variants: {
      variant: {
        success: 'border-l-primary',
        error: 'border-l-accent',
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
      <Primitive.Close aria-label={closeLabel} className={closeButton}>
        <CloseIcon />
      </Primitive.Close>
    </Primitive.Root>
  )
}
