'use client'

import { useCallback, useEffect, useRef } from 'react'

// Mientras un botón está ocupado queda deshabilitado, y el navegador le saca el foco. Cuando se
// libera sin haber navegado —un intento que no llegó—, el foco vuelve a él: quien usa el teclado no
// tiene que recorrer todo el formulario para intentar otra vez (docs/10 §Piso de accesibilidad). Si
// el foco ya está en otro lado, por ejemplo en el campo desde el que se mandó con Enter, se queda.
//
// Un ref de función y no un objeto: al liberarse, el lugar lo puede ocupar otro elemento, y uno
// tipado sobre `HTMLElement` se le pasa tanto a un `button` como a un `a`.
export function useRefocusAfterBusy(busy: boolean) {
  const target = useRef<HTMLElement | null>(null)
  const wasBusy = useRef(false)

  useEffect(() => {
    if (busy) {
      wasBusy.current = true
      return
    }
    if (!wasBusy.current) return
    wasBusy.current = false
    const focused = document.activeElement
    if (focused === null || focused === document.body) target.current?.focus()
  }, [busy])

  return useCallback((node: HTMLElement | null) => {
    target.current = node
  }, [])
}
