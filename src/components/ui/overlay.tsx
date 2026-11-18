'use client'

import { cloneElement, createContext, isValidElement, useContext, useState } from 'react'
import { useAfterOpenOrNow } from '@/hooks/use-after-open'

// Lo que comparten las capas superpuestas sin Radix: el estado, el disparador y la acción que
// cierra. La capa (Radix, el velo y la cruz) está en `overlay-layer.tsx` y llega después de abrir,
// o al tocar si se toca antes: pesaba 12 KB en cada pantalla con un diálogo (historia #304).

export type OverlayState = {
  /** Sin `trigger`, la capa se abre y se cierra desde afuera con `open` y `onOpenChange`. */
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type Clickable = {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
  'aria-haspopup'?: 'dialog'
  'aria-expanded'?: boolean
}

type Layer = typeof import('./overlay-layer')

export type LayerControl = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Al cerrar, el foco vuelve al disparador, como hacía el de Radix. */
  onCloseAutoFocus: (event: Event) => void
}

const loadLayer = () => import('./overlay-layer')

const CloseOverlay = createContext<() => void>(() => {})

/** Lo pone la capa, para que `OverlayAction` cierre sin importar Radix. */
export const OverlayCloser = CloseOverlay

// Envuelve un botón de acción para que además cierre la capa: «Cancelar», o «Eliminar» cuando la
// acción ya terminó.
export function OverlayAction({ children }: { children: React.ReactElement<Clickable> }) {
  const close = useContext(CloseOverlay)
  return cloneElement(children, {
    onClick: (event) => {
      children.props.onClick?.(event)
      if (!event.defaultPrevented) close()
    },
  })
}

type ShellProps = OverlayState & {
  children: (layer: Layer, control: LayerControl) => React.ReactNode
}

// El disparador sale del servidor y contesta desde el primer toque: si la capa todavía no llegó, la
// pide en ese momento y se abre apenas está.
export function OverlayShell({ trigger, open, onOpenChange, children }: ShellProps) {
  const [ownOpen, setOwnOpen] = useState(false)
  const isOpen = open ?? ownOpen
  const [opener, setOpener] = useState<HTMLElement | null>(null)
  const layer = useAfterOpenOrNow(loadLayer, isOpen)

  const setOpen = (next: boolean) => {
    if (open === undefined) setOwnOpen(next)
    onOpenChange?.(next)
  }

  const onCloseAutoFocus = (event: Event) => {
    if (opener === null) return
    event.preventDefault()
    opener.focus()
  }

  return (
    <>
      {isValidElement<Clickable>(trigger)
        ? cloneElement(trigger, {
            'aria-haspopup': 'dialog',
            'aria-expanded': isOpen,
            onClick: (event) => {
              trigger.props.onClick?.(event)
              if (event.defaultPrevented) return
              setOpener(event.currentTarget)
              setOpen(!isOpen)
            },
          })
        : trigger}
      {layer === null
        ? null
        : children(layer, { open: isOpen, onOpenChange: setOpen, onCloseAutoFocus })}
    </>
  )
}
