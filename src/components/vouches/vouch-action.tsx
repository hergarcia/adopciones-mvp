'use client'

import { deferredPart } from '@/components/ui/deferred-part'

// La hoja cliente del lugar de avalar y de una fila de «Mis avales». El `Sheet` y la acción llegan
// aparte: el perfil público lo abren sobre todo visitas sin sesión, que nunca los dibujan, y Next
// baja con la página todo el JavaScript que esta importa (presupuesto de JS, docs/07). Mientras
// llegan, el botón ocupa su lugar con la espera; si no llegan, ahí queda el aviso con «Reintentar»
// (historia #316).
export const VouchAction = deferredPart(() =>
  import('./vouch-action-sheet').then((module) => module.VouchActionSheet),
)
