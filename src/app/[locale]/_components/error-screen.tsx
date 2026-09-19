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
}

// Los dos límites de error del producto son la misma pantalla, así que viven en un solo lugar
// (docs/08 §Regla de dos). Con `h1`, porque un límite de error reemplaza la página entera y sin él
// la pantalla se queda sin encabezado (docs/10 §Piso de accesibilidad).
export function ErrorScreen({ title, body, retry, reset }: Props) {
  return (
    <PageShell>
      <h1 className="afiche text-center text-2xl text-ink">{title}</h1>
      <EmptyState title={body} action={<Button onClick={reset}>{retry}</Button>} />
    </PageShell>
  )
}
