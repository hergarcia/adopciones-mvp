import { EmptyState } from '@/components/ui/empty-state'

type Props = {
  /** Ya traducido: llegó, es anónimo, lo vamos a mirar y no vamos a contar el resultado. */
  body: string
  /** «Bloquear a Ana», o nulo si ya estaba bloqueada (FR-005). */
  blockOffer: React.ReactNode | null
  back: React.ReactNode
}

// La confirmación del reporte, dentro de la misma hoja y centrada: es una confirmación, una de las
// dos excepciones a la alineación a la izquierda (docs/10 §Layout).
export function ReportSent({ body, blockOffer, back }: Props) {
  return (
    <EmptyState
      className="w-full"
      title={body}
      action={
        <div className="flex flex-col items-center gap-3">
          {blockOffer}
          {back}
        </div>
      }
    />
  )
}
