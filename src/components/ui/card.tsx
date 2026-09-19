import { cn } from '@/lib/cn'

type Props = {
  children: React.ReactNode
  /** Un trozo de cinta arriba: alguien pegó esta nota. */
  taped?: boolean
  /** La card entera es un link o un botón: solo entonces se despega al hover. */
  interactive?: boolean
  className?: string
}

export function Card({ children, taped = false, interactive = false, className }: Props) {
  return (
    <div
      className={cn(
        'border-2 border-ink bg-canvas p-4',
        taped && 'cinta',
        interactive && 'lift',
        className,
      )}
    >
      {children}
    </div>
  )
}
