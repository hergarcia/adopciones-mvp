import { cn } from '@/lib/cn'

type Props = {
  children: React.ReactNode
  className?: string
}

// El marco de una pantalla de lectura: alineada a la izquierda, a la medida de lectura, con el
// gutter de docs/10, que cambia en 768.
export function PageShell({ children, className }: Props) {
  return (
    <main className={cn('max-w-[var(--measure)] p-gutter md:p-gutter-wide', className)}>
      {children}
    </main>
  )
}
