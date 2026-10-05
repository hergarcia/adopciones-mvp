'use client'

import { lazy, Suspense, type ComponentProps } from 'react'
import type { SavedToast } from './saved-toast'

const Toast = lazy(() => import('./saved-toast').then((module) => ({ default: module.SavedToast })))
const Flags = lazy(() => import('./drop-flags').then((module) => ({ default: module.DropFlags })))

// Los avisos aparecen solo después de una acción. Importados directo, bajaban con cada pantalla que
// puede mostrarlos, también el perfil público sin sesión (presupuesto de JS, docs/07). `lazy` de
// React y no `next/dynamic`: su cargador solo pasaba la ficha del presupuesto (historia #13).
export function LazySavedToast(props: ComponentProps<typeof SavedToast>) {
  return (
    <Suspense>
      <Toast {...props} />
    </Suspense>
  )
}

export function LazyDropFlags() {
  return (
    <Suspense>
      <Flags />
    </Suspense>
  )
}
