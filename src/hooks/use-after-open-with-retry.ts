import { useEffect, useEffectEvent, useState } from 'react'
import { afterOpen } from './after-open'

// Aparte de `use-after-open`: solo lo usa «Publicar un animal», y en el mismo archivo bajaba con
// cada pantalla que espera algo después de abrir (historia #318).

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
