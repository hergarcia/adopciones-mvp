'use client'

import { createContext, useContext } from 'react'

export type PublicErrorCopy = {
  title: string
  body: string
  retry: string
  /** El camino al listado, en la ficha. */
  toListing?: string
}

const Copy = createContext<PublicErrorCopy | null>(null)

// Los textos del límite de error de la zona pública, por contexto: un `error.tsx` es cliente y
// no recibe props. No es `ErrorTextsProvider` a propósito: ese baja el runtime de next-intl al
// navegador, y la zona pública —el perfil que se abre desde WhatsApp— tiene el presupuesto de JS
// más ajustado (docs/07).
export function PublicErrorCopyProvider({
  copy,
  children,
}: {
  copy: PublicErrorCopy
  children: React.ReactNode
}) {
  return <Copy value={copy}>{children}</Copy>
}

export function usePublicErrorCopy(): PublicErrorCopy | null {
  return useContext(Copy)
}
