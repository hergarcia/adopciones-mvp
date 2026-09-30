'use client'

import { useSyncExternalStore } from 'react'

const noChanges = () => () => {}

// Solo en un teléfono: ahí la hoja de compartir del sistema pone WhatsApp a un toque. En la
// computadora esa hoja es más lenta que copiar y pegar. En el servidor no se sabe: copiar.
function phoneCanShare(): boolean {
  return (
    typeof navigator.share === 'function' &&
    window.matchMedia('(hover: none) and (pointer: coarse)').matches
  )
}

export function useCanShare(): boolean {
  return useSyncExternalStore(noChanges, phoneCanShare, () => false)
}
