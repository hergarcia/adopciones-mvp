'use client'

import * as Primitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/cn'
import { CloseIcon } from './icons'

// Lo que comparten las capas superpuestas: el velo de tinta y la cruz de cerrar.
export const closeButton =
  'press inline-flex size-11 shrink-0 items-center justify-center text-ink-muted hover:text-ink'

export function Backdrop() {
  return (
    <Primitive.Overlay className="fixed inset-0 z-20 bg-ink/40 data-[state=closed]:animate-[fade-out_var(--dur-base)_var(--ease-out)] data-[state=open]:animate-[fade-in_var(--dur-base)_var(--ease-out)]" />
  )
}

type CloseProps = {
  /** Ya traducido. */
  label: string
  className?: string
}

export function OverlayClose({ label, className }: CloseProps) {
  return (
    <Primitive.Close aria-label={label} className={cn(closeButton, 'absolute', className)}>
      <CloseIcon />
    </Primitive.Close>
  )
}

type ActionProps = {
  children: React.ReactNode
}

// Envuelve un botón de acción para que además cierre la capa: «Cancelar», o «Eliminar» cuando la
// acción ya terminó.
export function OverlayAction({ children }: ActionProps) {
  return <Primitive.Close asChild>{children}</Primitive.Close>
}

export type OverlayState = {
  /** Sin `trigger`, la capa se abre y se cierra desde afuera con `open` y `onOpenChange`. */
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}
