import { useEffect, useEffectEvent, useState } from 'react'

// Lo que solo hace falta después de un toque baja apenas la pantalla abrió, sin esperar el toque
// (docs/07 §Presupuesto, historia #95): después de `load`, que ya trajo la foto principal, y del
// primer respiro del navegador, a más tardar 1 s después. Safari no tiene `requestIdleCallback`.
export function afterOpen(): Promise<void> {
  return new Promise((resolve) => {
    const idle = () => {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => resolve(), { timeout: 1_000 })
      } else {
        setTimeout(resolve, 0)
      }
    }
    if (document.readyState === 'complete') idle()
    else window.addEventListener('load', idle, { once: true })
  })
}

/**
 * Llama a `load` (un `import()` dinámico) una sola vez, después de abrir, y devuelve lo que trajo,
 * o `null` mientras no llegó. Si no llega —la señal se cortó antes—, queda en `null`: la hoja sigue
 * mostrando su cáscara.
 */
export function useAfterOpen<T>(load: () => Promise<T>): T | null {
  const [loaded, setLoaded] = useState<{ value: T } | null>(null)
  const run = useEffectEvent(load)

  useEffect(() => {
    let isMounted = true
    afterOpen()
      .then(() => run())
      .then((value) => {
        if (isMounted) setLoaded({ value })
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [])

  return loaded === null ? null : loaded.value
}
