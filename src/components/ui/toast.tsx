'use client'

import * as Primitive from '@radix-ui/react-toast'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { CloseIcon } from './icons'
import { closeButton } from './overlay'
import { paperStrip } from './paper-strip'

const toast =
  'flex items-center justify-between gap-3 font-medium shadow-float data-[state=closed]:animate-[fade-out_var(--dur-base)_var(--ease-out)] data-[state=open]:animate-[slide-up-in_var(--dur-base)_var(--ease-out)]'

export type ToastVariant = NonNullable<VariantProps<typeof paperStrip>['band']>

type Props = {
  /** Ya traducido. */
  message: string
  closeLabel: string
  variant?: ToastVariant
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}

type ProviderProps = {
  /** Cómo anuncia un lector de pantalla un aviso y su región. Ya traducidos: sin esto Radix
   *  los dice en inglés. */
  label: string
  regionLabel: string
  children: React.ReactNode
}

// El provider va en la hoja que dispara avisos, no en el layout: una primitiva no monta contexto
// global por su cuenta. 4 s en pantalla (docs/10 §Componentes).
export function ToastProvider({ label, regionLabel, children }: ProviderProps) {
  return (
    <Primitive.Provider label={label} swipeDirection="down" duration={4000}>
      {children}
      <Primitive.Viewport
        label={regionLabel}
        className="fixed inset-x-gutter bottom-gutter z-10 flex flex-col gap-2 md:right-auto md:bottom-gutter-wide md:left-gutter-wide md:w-full md:max-w-[var(--measure)]"
      />
    </Primitive.Provider>
  )
}

export function Toast({ message, closeLabel, variant, open, onOpenChange, className }: Props) {
  return (
    <Primitive.Root
      open={open}
      onOpenChange={onOpenChange}
      className={cn(paperStrip({ band: variant }), toast, className)}
    >
      <Primitive.Description>{message}</Primitive.Description>
      <Primitive.Close aria-label={closeLabel} className={closeButton}>
        <CloseIcon />
      </Primitive.Close>
    </Primitive.Root>
  )
}
