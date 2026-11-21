'use client'

import { useEffect, useState, type ComponentType } from 'react'
import { afterOpenModule } from '@/hooks/use-after-open'

/**
 * Lo que muestra un lugar mientras llega y si no llega (`RetryNotice`), dibujado en el servidor con
 * la forma y el lugar de lo que va a llegar (`later-part.tsx`, historia #316).
 */
export type LaterPart = { waiting: React.ReactNode; failed: React.ReactNode }

/**
 * Lo de adentro de una hoja o un lugar de la pantalla, en su propio archivo: baja cuando se dibuja o,
 * con `preload`, apenas abre la pantalla (historias #304 y #316). Mientras baja se ve la espera; si
 * no llega, el aviso con «Reintentar» queda en ese mismo lugar y la pantalla de atrás sigue como
 * estaba. Lo que ya llegó se dibuja entero desde el primer cuadro, sin pasar por la espera.
 */
export function deferredPart<P extends object>(
  load: () => Promise<ComponentType<P>>,
  preload = false,
) {
  let arrived: ComponentType<P> | null = null
  const keep = () =>
    load().then((Part) => {
      arrived = Part
      return Part
    })
  const get = preload ? afterOpenModule(keep) : keep

  return function DeferredPart({ props, part }: { props: P; part: LaterPart }) {
    const [Part, setPart] = useState(() => arrived)
    const [hasFailed, setHasFailed] = useState(false)
    const fetchPart = () =>
      get().then(
        (next) => setPart(() => next),
        () => setHasFailed(true),
      )

    useEffect(() => {
      if (arrived === null) void fetchPart()
    }, [])

    if (Part !== null) return <Part {...props} />
    return (
      // El único botón de adentro es «Reintentar», que viene del servidor: el toque se atiende acá,
      // vuelve a la espera y, si tampoco llega, el aviso se monta de nuevo y se vuelve a anunciar.
      // `contents`: la espera y el aviso ocupan el lugar de lo que llega, como si este div no estuviera.
      // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- escucha el `button` de adentro, que ya contesta al teclado
      <div
        className="contents"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest('button')) {
            setHasFailed(false)
            void fetchPart()
          }
        }}
      >
        {hasFailed ? part.failed : part.waiting}
      </div>
    )
  }
}
