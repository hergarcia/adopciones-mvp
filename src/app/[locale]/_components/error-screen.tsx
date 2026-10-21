'use client'

import { ReportClientFailure, type BoundaryError } from '@/components/errors/report-client-failure'
import { Button } from '@/components/ui/button'
import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { PageShell } from './page-shell'

/** Lo que Next le pasa a cada `error.tsx`. */
export type ErrorBoundaryProps = { error: BoundaryError; reset: () => void }

type Props = ErrorBoundaryProps & {
  /** Ya traducidos: cada zona pasa los suyos. */
  title: string
  body: string
  retry: string
  /** La salida que la pantalla sigue ofreciendo aunque no haya cargado, centrada bajo el reintento. */
  children?: React.ReactNode
}

// Los dos límites de error del producto son la misma pantalla, así que viven en un solo lugar
// (docs/08 §Regla de dos). Con `h1`, porque un límite de error reemplaza la página entera. A lo
// ancho de la hoja, para que el cartel quede centrado en ella y no en la columna de lectura. Cada
// falla que llega acá llega también al registro de errores (FR-030).
export function ErrorScreen({ error, title, body, retry, reset, children }: Props) {
  return (
    <PageShell width="full">
      <ReportClientFailure error={error} />
      <HeadedEmptyState
        title={title}
        body={body}
        action={<Button onClick={reset}>{retry}</Button>}
      />
      {children && <div className="flex justify-center">{children}</div>}
    </PageShell>
  )
}
