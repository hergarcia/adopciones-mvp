'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { destinationLeavingPage } from '@/lib/forms/leaving'

export type UnsavedChanges = {
  /** Adónde se quiso ir con cambios sin guardar, o null si no hay nada esperando respuesta. */
  leavingTo: string | null
  leave: () => void
  stay: () => void
}

// El aviso antes de perder lo escrito (FR-023), por los dos caminos que existen. Irse del sitio lo
// atiende el navegador: el texto que se le pasa se ignora desde hace años, pero hay que devolver
// algo para que el diálogo aparezca. Irse por un enlace nuestro no lo atiende nadie —navega del
// lado del cliente, sin recargar— así que se frena acá y lo pregunta la pantalla.
export function useUnsavedChanges(dirty: boolean): UnsavedChanges {
  const router = useRouter()
  const [leavingTo, setLeavingTo] = useState<string | null>(null)

  useEffect(() => {
    if (!dirty) return undefined

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
        },
        window.location.href,
      )
      if (destination === null) return

      event.preventDefault()
      event.stopPropagation()
      setLeavingTo(destination)
    }

    window.addEventListener('beforeunload', warn)
    document.addEventListener('click', intercept, true)
    return () => {
      window.removeEventListener('beforeunload', warn)
      document.removeEventListener('click', intercept, true)
    }
  }, [dirty])

  const leave = useCallback(() => {
    if (leavingTo !== null) router.push(leavingTo)
    setLeavingTo(null)
  }, [leavingTo, router])

  const stay = useCallback(() => setLeavingTo(null), [])

  return { leavingTo, leave, stay }
}
