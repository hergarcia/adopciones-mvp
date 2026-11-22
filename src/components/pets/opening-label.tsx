'use client'

import { useLinkStatus } from 'next/link'
import { BusyLabel } from '@/components/ui/button'

// «Marcar adoptado» es un enlace a «¿A quién se lo diste?», que tarda lo que tarde el servidor en
// contestar: desde el toque hasta que aparece la pantalla, trabaja como un botón (historia #334). El
// estado lo tiene el `Link` de Next; la marca escondida es la que lee la prueba de los toques.
export function OpeningLabel({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus()
  return (
    <>
      {pending ? <span data-link-opening hidden /> : null}
      <BusyLabel loading={pending}>{children}</BusyLabel>
    </>
  )
}
