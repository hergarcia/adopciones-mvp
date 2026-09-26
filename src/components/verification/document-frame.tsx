import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'

const FRAME = 'aspect-[4/3] w-full'

type Props =
  | { state: 'loading' }
  | { state: 'image'; src: string; alt: string }
  /** El hueco punteado: lo que va adentro lo pone quien lo usa (elegir la foto, o que no cargó). */
  | { state: 'slot'; children: React.ReactNode; className?: string }

// El marco 4:3 de una foto de la cédula, del lado de quien la manda y del de quien la revisa. Con un
// `img` nativo: la vista previa es local y la imagen del pedido no tiene que quedar cacheada en
// ningún lado (FR-019). Sin inclinación ni cinta: es un documento, no algo pegado (docs/10).
export function DocumentFrame(props: Props) {
  if (props.state === 'loading') return <Skeleton className={FRAME} />
  if (props.state === 'image') {
    return (
      // eslint-disable-next-line next/no-img-element
      <img
        src={props.src}
        alt={props.alt}
        className={cn(FRAME, 'border-2 border-ink bg-surface object-contain')}
      />
    )
  }
  return (
    <div
      className={cn(
        FRAME,
        'flex border-2 border-dashed border-line bg-surface p-4',
        props.className,
      )}
    >
      {props.children}
    </div>
  )
}
