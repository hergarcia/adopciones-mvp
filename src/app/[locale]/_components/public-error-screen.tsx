'use client'

import { afterOpen, useAfterOpen } from '@/hooks/use-after-open'
import type { ErrorScreenProps } from './error-screen'

const loadScreen = () => import('./error-screen')

// La pantalla de error de la zona pública llega después de abrir, no en el peso de apertura
// (historia #95, research R5). Se baja aunque nada falle: cuando algo falla, la señal puede ya no
// estar, y los textos tienen que verse igual (FR-014).
if (typeof window !== 'undefined')
  afterOpen()
    .then(loadScreen)
    .catch(() => {})

export function PublicErrorScreen(props: ErrorScreenProps) {
  const screen = useAfterOpen(loadScreen)
  return screen === null ? null : <screen.ErrorScreen {...props} />
}
