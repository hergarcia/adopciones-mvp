import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

// La columna de contenido dentro de la hoja que arma `PaperFrame`. Alineada a la izquierda, con el
// gutter de docs/10, que cambia en 768. `full` es para lo que se organiza en grilla —el listado—,
// que no tiene medida de lectura que respetar. `wide` lee en `--measure` debajo de 1024 y desde ahí
// usa el ancho de la hoja: lo que se arma en dos partes o va centrado en la hoja.
const shell = cva('p-gutter md:p-gutter-wide', {
  variants: {
    width: {
      reading: 'max-w-[var(--measure)]',
      full: '',
      wide: 'max-w-[var(--measure)] lg:max-w-none',
    },
  },
  defaultVariants: { width: 'reading' },
})

type Props = VariantProps<typeof shell> & {
  children: React.ReactNode
  className?: string
}

export function PageShell({ width, children, className }: Props) {
  return <main className={cn(shell({ width }), className)}>{children}</main>
}
