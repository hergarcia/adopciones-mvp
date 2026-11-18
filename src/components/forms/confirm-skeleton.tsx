import { Skeleton } from '@/components/ui/skeleton'

export type ConfirmShape = {
  /** El título de una pregunta o de un campo. */
  legend?: boolean
  /** La línea de ayuda debajo del título. */
  hint?: boolean
  /** Una casilla a lo ancho por opción, como las de un motivo. */
  options?: number
  /** El recuadro de un texto largo. */
  box?: boolean
  /** La nota antes de los botones. */
  note?: boolean
}

// Lo de adentro de una hoja o de una pregunta mientras llega (historia #316): los renglones de lo que
// se elige, el recuadro de lo que se escribe y los dos botones, en el lugar y con el alto que van a
// ocupar, así el título no se corre cuando llega.
export function ConfirmSkeleton({ legend, hint, options = 0, box, note }: ConfirmShape) {
  return (
    <div className="flex w-full flex-col gap-2">
      {legend ? <Skeleton className="h-5 w-48" /> : null}
      {hint ? <Skeleton className="h-5 w-full" /> : null}
      {Array.from({ length: options }, (_, row) => (
        <Skeleton key={`option-${row}`} className="h-11 w-full" />
      ))}
      {box ? <Skeleton className="h-24 w-full" /> : null}
      {note ? <Skeleton className="mt-2 h-5 w-3/4" /> : null}
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-3">
        <Skeleton className="h-11 w-40" />
        <Skeleton className="h-11 w-24" />
      </div>
    </div>
  )
}
