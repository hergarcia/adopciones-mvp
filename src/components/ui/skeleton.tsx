import { cn } from '@/lib/cn'

type Props = {
  className?: string
}

// El hueco donde va a ir algo pegado: recuadro punteado con shimmer, con la forma exacta del
// contenido que va a reemplazar. Nunca un spinner de página (docs/10 §Componentes).
export function Skeleton({ className }: Props) {
  return <div aria-hidden className={cn('shimmer border-2 border-dashed border-line', className)} />
}
