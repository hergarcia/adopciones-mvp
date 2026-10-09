import { cn } from '@/lib/cn'

type Props = {
  /** Una secuencia: numerar lo que no tiene orden es un antipatrón (docs/10). */
  items: readonly string[]
  className?: string
}

// El número en voz de afiche es dibujo: la `ol` ya le dice el orden a un lector de pantalla.
export function NumberedList({ items, className }: Props) {
  return (
    <ol className={cn('flex flex-col gap-6', className)}>
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
