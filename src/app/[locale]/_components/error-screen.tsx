'use client'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageShell } from './page-shell'

type Props = {
  /** Ya traducidos: cada zona pasa los suyos. */
  title: string
  body: string
  retry: string
  reset: () => void
  /** Lo que la pantalla sigue ofreciendo aunque no haya cargado, debajo del reintento. */
  children?: React.ReactNode
}

// Los dos límites de error del producto son la misma pantalla, así que viven en un solo lugar
// (docs/08 §Regla de dos). Con `h1`, porque un límite de error reemplaza la página entera y sin él
// la pantalla se queda sin encabezado (docs/10 §Piso de accesibilidad). A lo ancho de la hoja, con el
// título a la izquierda y el cartel centrado: en la medida de lectura el vacío quedaba corrido a la
// mitad izquierda de la hoja ancha (docs/10 §Pantallas anchas).
export function ErrorScreen({ title, body, retry, reset, children }: Props) {
  return (
    <PageShell width="full">
      <h1 className="afiche text-2xl text-ink">{title}</h1>
      <EmptyState title={body} className="mt-6" action={<Button onClick={reset}>{retry}</Button>} />
      {children}
    </PageShell>
  )
}
