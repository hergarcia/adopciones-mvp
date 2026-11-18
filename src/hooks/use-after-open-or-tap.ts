import { useEffect, useEffectEvent, useState } from 'react'
import { afterOpen } from './after-open'

// Más que esto esperando y la persona ya da el toque por perdido (historia #318).
const WAIT_MS = 10_000

/**
 * Los textos del aviso cuando lo que el toque pedía no llegó, ya traducidos: los pone el layout de
 * idioma en el `body`. Un provider en el layout, o leerlos en `RetryNotice`, sumaba código al abrir
 * en cada pantalla, también en las que no tienen nada que abrir con un toque.
 */
export function tapFailedTexts(): { message: string; retry: string } {
  const { partFailed = '', partRetry = '' } = document.body.dataset
  return { message: partFailed, retry: partRetry }
}

/**
 * Lo que solo hace falta después de un toque, como la capa de una hoja: baja después de abrir
 * (`preload`), o apenas `isNeeded` —una hoja que se abre sola—, y `value` es lo que trajo o `null`.
 * El toque que llega antes lo pide con `wait`: mientras baja, `isWaiting`; si no llega o tarda más de
 * 10 s, `hasFailed`, y `onArrive` no corre aunque llegue después, para que nada se abra solo encima
 * de lo que la persona está haciendo (historias #304 y #318). Un segundo toque mientras espera no
 * hace nada.
 */
export function useAfterOpenOrTap<T>(
  load: () => Promise<T>,
  isNeeded = false,
  preload = true,
): {
  value: T | null
  isWaiting: boolean
  hasFailed: boolean
  wait: (onArrive: () => void) => void
} {
  const [value, setValue] = useState<T | null>(null)
  const [tap, setTap] = useState<'waiting' | 'failed' | null>(null)
  const fetchValue = () =>
    load().then((next) => {
      setValue(() => next)
    })
  const request = useEffectEvent((now: boolean) => {
    if (now || (preload && value === null)) {
      ;(now ? fetchValue() : afterOpen().then(fetchValue)).catch(() => {})
    }
  })

  useEffect(() => {
    request(isNeeded)
  }, [isNeeded])

  return {
    value,
    isWaiting: tap === 'waiting',
    hasFailed: tap === 'failed',
    wait: (onArrive) => {
      if (tap === 'waiting') return
      setTap('waiting')
      Promise.race([
        fetchValue(),
        new Promise((_, reject) => {
          setTimeout(reject, WAIT_MS)
        }),
      ]).then(
        () => {
          setTap(null)
          onArrive()
        },
        () => setTap('failed'),
      )
    },
  }
}
