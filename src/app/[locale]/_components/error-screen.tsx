'use client'

import { Button } from '@/components/ui/button'
import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { PageShell } from './page-shell'

type Props = {
  /** Ya traducidos: cada zona pasa los suyos. */
  title: string
  body: string
  retry: string
  reset: () => void
}

// Los dos límites de error del producto son la misma pantalla, así que viven en un solo lugar
// (docs/08 §Regla de dos). Con `h1`, porque un límite de error reemplaza la página entera. A lo
// ancho de la hoja, para que el cartel quede centrado en ella y no en la columna de lectura.
export function ErrorScreen({ title, body, retry, reset }: Props) {
  return (
    <PageShell width="full">
      <HeadedEmptyState
        title={title}
        body={body}
        action={<Button onClick={reset}>{retry}</Button>}
      />
    </PageShell>
  )
}
