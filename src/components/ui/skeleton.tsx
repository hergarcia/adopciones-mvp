import { cn } from '@/lib/cn'

type Props = {
  className?: string
}

// Shimmer sobre la superficie, con la forma exacta del contenido que va a reemplazar. Nunca un
// spinner de página (docs/10 §Componentes). El shimmer se detiene con prefers-reduced-motion.
export function Skeleton({ className }: Props) {
  return <div aria-hidden className={cn('shimmer rounded-control bg-surface', className)} />
}
