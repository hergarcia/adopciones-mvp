'use client'

import { useEffect, useRef } from 'react'

// Mientras un botón está ocupado queda deshabilitado, y el navegador le saca el foco. Cuando se
// libera sin haber navegado —un intento que no llegó—, el foco vuelve a él: quien usa el teclado no
// tiene que recorrer todo el formulario para intentar otra vez (docs/10 §Piso de accesibilidad). Si
// el foco ya está en otro lado, por ejemplo en el campo desde el que se mandó con Enter, se queda.
export function useRefocusAfterBusy<T extends HTMLElement>(busy: boolean) {
  const ref = useRef<T>(null)
  const wasBusy = useRef(false)

  useEffect(() => {
    if (busy) {
      wasBusy.current = true
      return
    }
    if (!wasBusy.current) return
    wasBusy.current = false
    const focused = document.activeElement
    if (focused === null || focused === document.body) ref.current?.focus()
  }, [busy])

  return ref
}
