import { cn } from '@/lib/cn'

const SHEET = 'absolute inset-0 border-2 border-line bg-surface'

type Props = {
  /** Una camada es una pila de carteles; un animal, uno solo. */
  stacked: boolean
  className?: string
}

// Un cartel dibujado sin texto, para mostrar la diferencia entre las dos respuestas de publicar. Las
// hojas de atrás se corren en vez de girar más: lo pegado no pasa de `--tilt` (docs/10).
export function PosterSketch({ stacked, className }: Props) {
  return (
    <div aria-hidden="true" className={cn('relative aspect-[4/5]', className)}>
      {stacked ? (
        <>
          <div className={cn(SHEET, 'translate-x-4 -translate-y-2 rotate-(--tilt)')} />
          <div className={cn(SHEET, 'translate-x-2 -translate-y-1')} />
        </>
      ) : null}
      <div className={cn(SHEET, 'rotate-[calc(var(--tilt)*-1)]')}>
        <div className="cinta flex h-full flex-col gap-2 p-2">
          <div className="aspect-square w-full bg-line" />
          <div className="h-2 w-3/4 bg-line" />
          <div className="h-2 w-1/2 bg-line" />
        </div>
      </div>
    </div>
  )
}
