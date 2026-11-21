'use client'

import { cloneElement, createContext, useContext } from 'react'
import type { Clickable } from './overlay'

// Aparte de `overlay.tsx`: solo lo usa lo de adentro de una hoja, que baja después de abrir, y en el
// mismo archivo bajaba con cada pantalla que tiene una hoja (historia #318).

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

/** Las acciones de un `Dialog` o una `Sheet` que además la cierran. */
export const DialogClose = OverlayAction
export const SheetClose = OverlayAction
