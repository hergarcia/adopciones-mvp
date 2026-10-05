'use client'

import { Activity, lazy, useState, type ComponentProps } from 'react'
import { afterOpen } from '@/hooks/use-after-open'
import type { ListingController } from './listing-controller'

const LATER_FAILED = 'data-later-failed'

const load = () =>
  import('./listing-controller').then((module) => ({ default: module.ListingController }))

// En el servidor se pide ya, así el primer listado sale entero en el HTML (FR-010).
const onServer = typeof window === 'undefined' ? load() : null

// Si no llega (la señal se cortó después de abrir), el listado queda como lo dibujó el servidor y
// muestra «Ver resultados», como sin JavaScript (FR-011): el atributo lo lee `ListingFilters`. Sin
// `catch`, el error del `import()` cambiaría el listado por la pantalla de error. `lazy` guarda esa
// promesa que no termina, así que el próximo montaje usa otro `lazy`: ahí no hay HTML del servidor
// que conservar, y quedarse esperando colgaría la navegación.
let LiveListing = lazy(
  () =>
    onServer ??
    afterOpen()
      .then(load)
      .catch(() => {
        document.documentElement.setAttribute(LATER_FAILED, '')
        LiveListing = lazy(loadAgain)
        return new Promise<never>(() => {})
      }),
)

// Si tampoco llega, el error sube a la pantalla de error del listado, con «Reintentar».
function loadAgain() {
  return load().then(
    (module) => {
      document.documentElement.removeAttribute(LATER_FAILED)
      return module
    },
    (error: unknown) => {
      LiveListing = lazy(loadAgain)
      throw error
    },
  )
}

// El listado entero llega después de abrir (historia #95, research R4): `Activity` es un límite de
// hidratación, así que hasta que llega su código queda el HTML del servidor, quieto, con el
// formulario GET y «Ver más» como enlace. No es `Suspense` porque React manda aparte, oculto hasta
// que corre JavaScript, el contenido de un `Suspense` grande.
export function ListingShell(props: ComponentProps<typeof ListingController>) {
  // Uno por montaje: si cambiara entre dos dibujos del mismo listado, React lo montaría de nuevo.
  const [Live] = useState(() => LiveListing)
  return (
    <Activity>
      <Live {...props} />
    </Activity>
  )
}
