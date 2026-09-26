'use client'

import { createContext, use, useCallback, useEffect, useState } from 'react'

const ExpireClaim = createContext<() => void>(() => {})

/** Para las hojas de adentro que se enteran por el servidor de que la prueba ya no vale. */
export function useExpireClaim(): () => void {
  return use(ExpireClaim)
}

type Props = {
  /** Cuánto falta para la hora límite, calculado en el servidor (`claimDeadline`). */
  msLeft: number
  /** Lo que se ve cuando la prueba ya no vale, ya dibujado por el servidor. */
  expired: React.ReactNode
  children: React.ReactNode
}

// Solo el temporizador: cuando pasa la hora límite con la pantalla abierta, la pantalla entera pasa
// sola a pedir un código nuevo, sin mostrar una hora ya pasada (FR-005a). Lo mismo si una acción
// de adentro se entera antes de que la prueba dejó de valer (FR-008).
export function ClaimDeadline({ msLeft, expired, children }: Props) {
  const [isExpired, setExpired] = useState(msLeft <= 0)
  const expire = useCallback(() => setExpired(true), [])

  useEffect(() => {
    const timer = setTimeout(expire, msLeft)
    return () => clearTimeout(timer)
  }, [msLeft, expire])

  return <ExpireClaim value={expire}>{isExpired ? expired : children}</ExpireClaim>
}
