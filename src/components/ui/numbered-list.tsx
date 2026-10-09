import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'

// `two`: dos columnas desde 1024, con más aire entre ellas (`RescuerSteps`).
const list = cva('gap-6', {
  variants: {
    columns: { one: 'flex flex-col', two: 'grid lg:grid-cols-2 lg:gap-8' },
  },
  defaultVariants: { columns: 'one' },
})

type Props = {
  /** Una secuencia: numerar lo que no tiene orden es un antipatrón (docs/10). */
  items: readonly string[]
  columns?: 'one' | 'two'
  className?: string
}

// El número en voz de afiche es dibujo: la `ol` ya le dice el orden a un lector de pantalla.
export function NumberedList({ items, columns, className }: Props) {
  return (
    <ol className={cn(list({ columns }), className)}>
      {items.map((item, index) => (
        <li key={item} className="flex max-w-[var(--measure)] gap-4">
          <span aria-hidden className="afiche w-6 shrink-0 text-2xl text-ink">
            {index + 1}
          </span>
          <p className="text-base text-ink">{item}</p>
        </li>
      ))}
    </ol>
  )
}
