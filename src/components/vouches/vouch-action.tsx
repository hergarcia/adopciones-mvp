'use client'

import dynamic from 'next/dynamic'
import type { VouchActionProps } from './vouch-action-sheet'

// La hoja cliente del lugar de avalar y de una fila de «Mis avales». El `Sheet` y la acción llegan
// aparte: el perfil público lo abren sobre todo visitas sin sesión, que nunca los dibujan, y Next
// baja con la página todo el JavaScript que esta importa (presupuesto de JS, docs/07).
const VouchActionSheet = dynamic(() =>
  import('./vouch-action-sheet').then((module) => module.VouchActionSheet),
)

export function VouchAction(props: VouchActionProps) {
  return <VouchActionSheet {...props} />
}
