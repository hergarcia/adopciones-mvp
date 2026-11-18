'use client'

import { cloneElement, isValidElement, useState } from 'react'
import { tapFailedTexts, useAfterOpenOrTap } from '@/hooks/use-after-open-or-tap'
import { RetryNotice } from './retry-notice'

// Lo que comparten las capas superpuestas sin Radix: el estado y el disparador. La capa (Radix, el
// velo y la cruz) está en `overlay-layer.tsx` y llega después de abrir, o al tocar si se toca antes:
// pesaba 12 KB en cada pantalla con un diálogo (historia #304). Lo que cierra desde adentro está en
// `overlay-close.tsx`, que baja con lo de adentro (historia #318).

export type OverlayState = {
  /** Sin `trigger`, la capa se abre y se cierra desde afuera con `open` y `onOpenChange`. */
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export type Clickable = {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
  /** El disparador es un `Button`: trabaja mientras su capa llega. */
  loading?: boolean
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

type ShellProps = OverlayState & {
  children: (layer: Layer, control: LayerControl) => React.ReactNode
}

// El disparador sale del servidor y contesta desde el primer toque: si la capa todavía no llegó, la
// pide en ese momento, trabaja mientras baja y se abre apenas está; si no llega, lo dice debajo
// (historia #318).
export function OverlayShell({ trigger, open, onOpenChange, children }: ShellProps) {
  const [ownOpen, setOwnOpen] = useState(false)
  const isOpen = open ?? ownOpen
  const [opener, setOpener] = useState<HTMLElement | null>(null)
  const layer = useAfterOpenOrTap(loadLayer, isOpen)

  const setOpen = (next: boolean) => {
    if (open === undefined) setOwnOpen(next)
    onOpenChange?.(next)
  }
  const openOnArrival = () => layer.wait(() => setOpen(true))

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
            loading: layer.isWaiting || trigger.props.loading,
            onClick: (event) => {
              trigger.props.onClick?.(event)
              if (event.defaultPrevented) return
              setOpener(event.currentTarget)
              if (layer.value === null) openOnArrival()
              else setOpen(!isOpen)
            },
          })
        : trigger}
      {layer.value === null ? (
        layer.hasFailed ? (
          <RetryNotice texts={tapFailedTexts()} onRetry={openOnArrival} />
        ) : null
      ) : (
        children(layer.value, { open: isOpen, onOpenChange: setOpen, onCloseAutoFocus })
      )}
    </>
  )
}
