import { cva } from 'class-variance-authority'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'

const FRAME = 'aspect-[4/3] w-full'

// Piedra para el hueco que invita a elegir; papel cuando adentro va texto de error, que en ceibo
// sobre piedra no llega a AA.
const slot = cva(`${FRAME} flex border-2 border-dashed border-line p-4`, {
  variants: { tone: { surface: 'bg-surface', canvas: 'bg-canvas' } },
  defaultVariants: { tone: 'surface' },
})

type Props =
  | { state: 'loading' }
  | { state: 'image'; src: string; alt: string }
  /** El hueco punteado: lo que va adentro lo pone quien lo usa (elegir la foto, o que no cargó). */
  | {
      state: 'slot'
      children: React.ReactNode
      tone?: 'surface' | 'canvas'
      className?: string
    }

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
  return <div className={cn(slot({ tone: props.tone }), props.className)}>{props.children}</div>
}
