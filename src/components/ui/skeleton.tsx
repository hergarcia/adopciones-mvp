import { cn } from '@/lib/cn'

type Props = {
  className?: string
}

// Quien lo usa le da la forma exacta de lo que va a reemplazar (docs/10 §Componentes).
export function Skeleton({ className }: Props) {
  return <div aria-hidden className={cn('shimmer border-2 border-dashed border-line', className)} />
}
