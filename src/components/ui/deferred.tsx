'use client'

import { lazy, Suspense, useState, type ComponentType } from 'react'
import { afterOpenModule } from '@/hooks/use-after-open'

/**
 * Lo que se dibuja solo después de un toque —el cuerpo de una hoja, el de un diálogo—, en su propio
 * archivo: baja después de abrir y, si se toca antes, en ese momento (historia #304).
 */
export function deferred<P extends object>(load: () => Promise<ComponentType<P>>) {
  const get = afterOpenModule(load)
  const Lazy = lazy(() => get().then((Component) => ({ default: Component })))
  return function Deferred(props: P) {
    return (
      <Suspense>
        <Lazy {...props} />
      </Suspense>
    )
  }
}

/**
 * Lo que se dibuja pocas veces —una encuesta pendiente, la camada al publicar un animal—: importado
 * directo bajaba en cada apertura de la pantalla aunque no se dibujara, porque una ruta trae todo lo
 * que importa (historia #304). Así baja solo cuando se dibuja.
 */
export function drawnOnly<P extends object>(load: () => Promise<ComponentType<P>>) {
  const Lazy = lazy(() => load().then((Component) => ({ default: Component })))
  return function DrawnOnly(props: P) {
    return (
      <Suspense>
        <Lazy {...props} />
      </Suspense>
    )
  }
}

/**
 * Como `deferred`, para lo que se abre desde afuera —los avisos de un formulario—: no se dibuja
 * hasta que `when` es verdadero la primera vez, y después queda, para que pueda cerrarse con su
 * animación.
 */
export function deferredUntil<P extends object>(load: () => Promise<ComponentType<P>>) {
  const get = afterOpenModule(load)
  const Lazy = lazy(() => get().then((Component) => ({ default: Component })))
  return function DeferredUntil({ when, props }: { when: boolean; props: P }) {
    const [isShown, setIsShown] = useState(when)
    if (when && !isShown) setIsShown(true)
    if (!isShown) return null
    return (
      <Suspense>
        <Lazy {...props} />
      </Suspense>
    )
  }
}
