'use client'

import { useLinkStatus } from 'next/link'
import { useEffect, useEffectEvent } from 'react'

type Props = {
  /** Cuando la pantalla que abría ya apareció, o el viaje se cortó. */
  onSettled?: () => void
}

// Desde que se suelta un enlace hasta que aparece lo que abre (la pantalla o su espera), una marca
// escondida que el CSS lee con `:has` para apagarlo: el estado lo tiene el `Link` de Next, y lo que
// lo envuelve sigue siendo de servidor (historias #302 y #350).
export function OpeningMark({ onSettled }: Props) {
  const { pending } = useLinkStatus()
  const settle = useEffectEvent(() => onSettled?.())
  useEffect(() => {
    if (!pending) settle()
  }, [pending])
  return pending ? <span data-opening hidden /> : null
}
