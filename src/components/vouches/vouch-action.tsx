'use client'

import { drawnOnly } from '@/components/ui/deferred'

// La hoja cliente del lugar de avalar y de una fila de «Mis avales». El `Sheet` y la acción llegan
// aparte: el perfil público lo abren sobre todo visitas sin sesión, que nunca los dibujan, y Next
// baja con la página todo el JavaScript que esta importa (presupuesto de JS, docs/07). Con `lazy`
// de React y no con `next/dynamic`, cuyo cargador solo pesaba 6 KB en la solicitud recibida
// (historia #304).
export const VouchAction = drawnOnly(() =>
  import('./vouch-action-sheet').then((module) => module.VouchActionSheet),
)
