'use client'

import { lazy, Suspense, type ComponentType } from 'react'
import type { ErrorBoundaryProps } from './error-screen'

// Next baja cada límite de error con su pantalla, aunque se dibuje solo si algo falla: así baja
// recién cuando se dibuja (historia #304). Un límite se dibuja cuando el servidor contestó con un
// error, o sea con la red andando.
export function lazyErrorBoundary(load: () => Promise<ComponentType<ErrorBoundaryProps>>) {
  const Lazy = lazy(() => load().then((Component) => ({ default: Component })))
  return function ErrorBoundary(props: ErrorBoundaryProps) {
    return (
      <Suspense>
        <Lazy {...props} />
      </Suspense>
    )
  }
}
