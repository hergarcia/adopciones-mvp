import { cn } from '@/lib/cn'

type Props = {
  children: React.ReactNode
  /** Un trozo de cinta arriba: alguien pegó esta nota. */
  taped?: boolean
  className?: string
}

// Una nota de papel: borde de tinta, sin sombra en reposo. Al hover se despega apenas del poste,
// vía la utilidad `lift` de globals.css (docs/10 §Componentes).
export function Card({ children, taped = false, className }: Props) {
  return (
    <div className={cn('lift border-2 border-ink bg-canvas p-4', taped && 'cinta', className)}>
      {children}
    </div>
  )
}
