import { cn } from '@/lib/cn'

type Props = {
  children: React.ReactNode
  className?: string
}

// Sin sombra en reposo: los planos se separan con línea y superficie. La sombra aparece al hover,
// vía la utilidad `lift` de globals.css (docs/10 §Espacio, radio, elevación).
export function Card({ children, className }: Props) {
  return <div className={cn('lift rounded-card border border-line p-4', className)}>{children}</div>
}
