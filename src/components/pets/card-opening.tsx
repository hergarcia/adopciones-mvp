'use client'

import { useLinkStatus } from 'next/link'

// Desde que se suelta la card hasta que aparece lo que abre (la ficha o su espera), una marca que
// `.sink` lee con `:has` para apagarla: el estado lo tiene el `Link` de Next, y la card sigue siendo
// de servidor (historia #302).
export function CardOpening() {
  const { pending } = useLinkStatus()
  return pending ? <span data-opening hidden /> : null
}
