'use client'

import { createPortal } from 'react-dom'
import { ToastProvider } from '@/components/ui/toast'
import type { ToastPlacement } from './share-button'

// La región de avisos, fuera del renglón de acciones: adentro sumaría un hueco al aparecer.
export function PlacedToast({
  placement,
  children,
}: {
  placement: ToastPlacement
  children: React.ReactNode
}) {
  if (placement.region !== 'own') return children
  return createPortal(
    <ToastProvider label={placement.toast.label} regionLabel={placement.toast.region}>
      {children}
    </ToastProvider>,
    document.body,
  )
}
