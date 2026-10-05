'use client'

import { lazy, Suspense } from 'react'
import type { UnblockButton as Eager } from './unblock-button'

const UnblockButton = lazy(() =>
  import('./unblock-button').then((module) => ({ default: module.UnblockButton })),
)

// La ficha y el perfil públicos solo dibujan «Desbloquear» para quien bloqueó: importado directo,
// bajaba con cada visita sin sesión. `lazy` de React y no `next/dynamic`, cuyo cargador solo ya
// pasaba la ficha del presupuesto de JS (docs/07).
export function LazyUnblockButton(props: React.ComponentProps<typeof Eager>) {
  return (
    <Suspense>
      <UnblockButton {...props} />
    </Suspense>
  )
}
