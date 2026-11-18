import { useEffect, useEffectEvent, useRef, useState } from 'react'

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

/**
 * Como `useAfterOpen`, pero si hace falta antes (un toque antes de que llegue), lo pide en ese
 * momento: lo que se tocó contesta apenas llega, sin esperar a que la pantalla termine de abrir.
 */
export function useAfterOpenOrNow<T>(load: () => Promise<T>, isNeeded: boolean): T | null {
  const [loaded, setLoaded] = useState<{ value: T } | null>(null)
  const isRequested = useRef(false)
  const request = useEffectEvent(() => {
    if (isRequested.current) return
    isRequested.current = true
    load().then(
      (value) => setLoaded({ value }),
      () => {
        isRequested.current = false
      },
    )
  })

  useEffect(() => {
    afterOpen()
      .then(() => request())
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isNeeded) request()
  }, [isNeeded])

  return loaded === null ? null : loaded.value
}

/**
 * Un módulo que solo hace falta al tocar, como el schema que revisa un formulario al enviarlo: se
 * pide después de abrir, y el toque que llega antes lo pide en ese momento y lo espera. Una sola
 * descarga para todas las llamadas.
 */
export function afterOpenModule<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null
  const get = () => {
    pending ??= load().catch((error: unknown) => {
      pending = null
      throw error
    })
    return pending
  }
  if (typeof window !== 'undefined') {
    afterOpen()
      .then(get)
      .catch(() => {})
  }
  return get
}

/**
 * Como `useAfterOpen`, para lo que la pantalla necesita sí o sí, como los campos de un formulario:
 * si no llega (la señal se cortó después de abrir), lo dice en `hasFailed` y `retry` lo vuelve a
 * pedir, en lugar de dejar la espera para siempre (historia #304). La pantalla de error de la ruta
 * no sirve: también baja después de abrir.
 */
export function useAfterOpenWithRetry<T>(load: () => Promise<T>): {
  value: T | null
  hasFailed: boolean
  retry: () => void
} {
  const [loaded, setLoaded] = useState<{ value: T } | null>(null)
  const [hasFailed, setHasFailed] = useState(false)
  const request = useEffectEvent(() => {
    setHasFailed(false)
    load().then(
      (value) => setLoaded({ value }),
      () => setHasFailed(true),
    )
  })

  useEffect(() => {
    afterOpen()
      .then(() => request())
      .catch(() => {})
  }, [])

  return { value: loaded === null ? null : loaded.value, hasFailed, retry: request }
}
