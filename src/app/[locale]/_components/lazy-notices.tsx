'use client'

import dynamic from 'next/dynamic'

// Los avisos aparecen solo después de una acción. Importados directo, bajaban con cada pantalla que
// puede mostrarlos, también el perfil público sin sesión (presupuesto de JS, docs/07).
export const LazySavedToast = dynamic(() =>
  import('./saved-toast').then((module) => module.SavedToast),
)

export const LazyDropFlags = dynamic(() =>
  import('./drop-flags').then((module) => module.DropFlags),
)
