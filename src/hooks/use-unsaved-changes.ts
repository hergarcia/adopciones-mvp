'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cleanAction, popAction, sentinelState, shouldPushSentinel } from '@/lib/forms/back-guard'
import { destinationLeavingPage } from '@/lib/forms/leaving'

export type UnsavedChanges = {
  /** Adónde se quiso ir con cambios sin guardar, o null si no hay nada esperando respuesta. */
  leavingTo: string | null
  leave: () => void
  stay: () => void
  /** Suelta el guardia para una salida elegida (publicó, guardó, eligió irse desde un aviso). */
  release: () => void
}

/** Navega sin dejar la centinela en el medio: si está arriba, el destino la reemplaza. */
export function leaveTo(router: ReturnType<typeof useRouter>, destination: string) {
  if (cleanAction(window.history.state) === 'retreat') router.replace(destination)
  else router.push(destination)
}

// El volver del navegador no tiene destino conocido: se sale volviendo dos lugares.
const BACK = 'back'

// El aviso antes de perder lo escrito (FR-023), por los tres caminos que existen. Irse del sitio lo
// atiende el navegador: el texto que se le pasa se ignora desde hace años, pero hay que devolver
// algo para que el diálogo aparezca. Irse por un enlace nuestro no lo atiende nadie —navega del
// lado del cliente, sin recargar— así que se frena acá y lo pregunta la pantalla. Y el volver del
// navegador se frena con una entrada centinela en el historial (lib/forms/back-guard.ts).
export function useUnsavedChanges(dirty: boolean): UnsavedChanges {
  const router = useRouter()
  const [leavingTo, setLeavingTo] = useState<string | null>(null)
  const released = useRef(false)

  useEffect(() => {
    if (!dirty) {
      if (!released.current && cleanAction(window.history.state) === 'retreat') {
        window.history.back()
      }
      return undefined
    }

    function warn(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }

    // En captura y sobre `document`: React escucha en su contenedor, que está más adentro, así que
    // frenar acá llega antes que el enlace y que el router.
    function intercept(event: MouseEvent) {
      const target = event.target
      const anchor = target instanceof Element ? target.closest('a[href]') : null
      const destination = destinationLeavingPage(
        {
          href: anchor?.getAttribute('href') ?? null,
          target: anchor?.getAttribute('target') ?? null,
          download: anchor?.hasAttribute('download') ?? false,
          button: event.button,
          modified: event.metaKey || event.ctrlKey || event.shiftKey || event.altKey,
          defaultPrevented: event.defaultPrevented,
          announcedExit: anchor?.closest('[data-announced-exit]') != null,
        },
        window.location.href,
      )
      if (destination === null) return

      event.preventDefault()
      event.stopPropagation()
      setLeavingTo(destination)
    }

    function back(event: PopStateEvent) {
      if (popAction(event.state, !released.current) === 'ignore') return
      window.history.pushState(sentinelState(event.state), '')
      setLeavingTo(BACK)
    }

    released.current = false
    if (shouldPushSentinel(window.history.state)) {
      window.history.pushState(sentinelState(window.history.state), '')
    }
    window.addEventListener('beforeunload', warn)
    window.addEventListener('popstate', back)
    document.addEventListener('click', intercept, true)
    return () => {
      window.removeEventListener('beforeunload', warn)
      window.removeEventListener('popstate', back)
      document.removeEventListener('click', intercept, true)
    }
  }, [dirty])

  const leave = useCallback(() => {
    released.current = true
    if (leavingTo === BACK) window.history.go(-2)
    else if (leavingTo !== null) leaveTo(router, leavingTo)
    setLeavingTo(null)
  }, [leavingTo, router])

  const stay = useCallback(() => setLeavingTo(null), [])
  const release = useCallback(() => {
    released.current = true
  }, [])

  return { leavingTo, leave, stay, release }
}
