import { useEffect, useEffectEvent, useState } from 'react'
import { afterOpen } from './after-open'

// `afterOpen` vive en `after-open.ts`: el listado solo usa eso, y este archivo entero bajaba con él
// (historia #318).

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
