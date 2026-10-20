'use client'

import { useEffect, type RefObject } from 'react'

// En una fila que se desplaza de costado, lo marcado puede quedar fuera de la vista y el filtro no
// se ve puesto. Al abrir, la fila corre lo justo para mostrar la primera casilla marcada, sin mover
// la página. Si la fila no se desplaza (desde 1024 fluye en renglones), no hace nada.
export function useRevealChecked(row: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const strip = row.current
    if (strip === null || strip.scrollWidth <= strip.clientWidth) return
    const label = strip.querySelector('input:checked')?.closest('label')
    if (label === null || label === undefined) return
    const overflow = label.getBoundingClientRect().right - strip.getBoundingClientRect().right
    if (overflow > 0) strip.scrollBy({ left: overflow })
  }, [row])
}
