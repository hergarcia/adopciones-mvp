'use client'

import type { VariantProps } from 'class-variance-authority'
import { createContext, useContext, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAfterOpenOrTap } from '@/hooks/use-after-open-or-tap'
import type { paperStrip } from './paper-strip'

export type ToastVariant = NonNullable<VariantProps<typeof paperStrip>['band']>

export type ToastProps = {
  /** Ya traducido. */
  message: string
  closeLabel: string
  variant?: ToastVariant
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}

export type ToastRegion = {
  /** Cómo anuncia un lector de pantalla un aviso y su región. Ya traducidos: sin esto Radix
   *  los dice en inglés. */
  label: string
  regionLabel: string
}

const Region = createContext<ToastRegion | null>(null)

const loadLayer = () => import('./toast-layer')

// El provider va en la hoja que dispara avisos, no en el layout: una primitiva no monta contexto
// global por su cuenta. Solo lleva los textos de la región: Radix llega con el aviso, después de
// abrir (`toast-layer.tsx`), y pesaba 8 KB en cada pantalla que puede avisar (historia #304).
export function ToastProvider({
  label,
  regionLabel,
  children,
}: ToastRegion & { children: React.ReactNode }) {
  const region = useMemo(() => ({ label, regionLabel }), [label, regionLabel])
  return <Region value={region}>{children}</Region>
}

// Cada aviso trae su región, en el cuerpo de la página: adentro de la hoja sumaría un hueco al
// aparecer.
export function Toast(props: ToastProps) {
  const region = useContext(Region)
  const layer = useAfterOpenOrTap(loadLayer, props.open).value
  if (layer === null || region === null) return null
  return createPortal(<layer.ToastLayer {...region} {...props} />, document.body)
}
