import { ViewTransition } from 'react'

type Props = {
  /** El de `coverTransitionName`; sin nombre, la foto no viaja (la tarjeta de «Mis animales»). */
  name?: string
  children: React.ReactNode
}

// La foto que pasa de la tarjeta a la portada de la ficha y vuelve (historia #307): el navegador la
// lleva cuando las dos pantallas la tienen en la misma navegación. Si la ficha pasa por su espera, la
// portada llega después y no hay con qué emparejarla, así que aparece en su lugar sin volar.
// `default="none"` la deja quieta en cualquier otra transición, como un filtro o «Ver más».
export function CoverFlight({ name, children }: Props) {
  if (name === undefined) return children
  return (
    <ViewTransition name={name} share="cover-flight" default="none">
      {children}
    </ViewTransition>
  )
}
