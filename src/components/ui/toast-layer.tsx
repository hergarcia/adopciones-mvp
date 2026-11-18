'use client'

import * as Primitive from '@radix-ui/react-toast'
import { cn } from '@/lib/cn'
import { CloseIcon } from './icons'
import { closeButton } from './overlay-styles'
import { paperStrip } from './paper-strip'
import type { ToastProps, ToastRegion } from './toast'

const toast =
  'flex items-center justify-between gap-3 font-medium shadow-float data-[state=closed]:animate-[fade-out_var(--dur-base)_var(--ease-out)] data-[state=open]:animate-[slide-up-in_var(--dur-base)_var(--ease-out)]'

// La parte de Radix de `Toast`, con su región: llega después de abrir, o al aparecer el primer aviso.
// 4 s en pantalla (docs/10 §Componentes).
export function ToastLayer({
  label,
  regionLabel,
  message,
  closeLabel,
  variant,
  open,
  onOpenChange,
  className,
}: ToastProps & ToastRegion) {
  return (
    <Primitive.Provider label={label} swipeDirection="down" duration={4000}>
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
      <Primitive.Viewport
        label={regionLabel}
        className="fixed inset-x-gutter bottom-gutter z-10 flex flex-col gap-2 md:right-auto md:bottom-gutter-wide md:left-gutter-wide md:w-full md:max-w-[var(--measure)]"
      />
    </Primitive.Provider>
  )
}
