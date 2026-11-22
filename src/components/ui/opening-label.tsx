'use client'

import { useLinkStatus } from 'next/link'
import { useEffect, useEffectEvent } from 'react'
import { BusyLabel } from './button'

type Props = {
  children: React.ReactNode
  /** Cuando la pantalla que abría ya apareció, o el viaje se cortó. */
  onSettled?: () => void
}

// El texto de un enlace que tarda lo que tarde el servidor en contestar, como «Marcar adoptado» o
// «Quiero adoptar»: desde el toque hasta que aparece la pantalla, trabaja como un botón (historias
// #334 y #336). El estado lo tiene el `Link` de Next; la marca escondida es la que lee la prueba de
// los toques.
export function OpeningLabel({ children, onSettled }: Props) {
  const { pending } = useLinkStatus()
  const settle = useEffectEvent(() => onSettled?.())

  useEffect(() => {
    if (!pending) settle()
  }, [pending])

  return (
    <>
      {pending ? <span data-link-opening hidden /> : null}
      <BusyLabel loading={pending}>{children}</BusyLabel>
    </>
  )
}
