import { cn } from '@/lib/cn'
import { CheckIcon } from './icons'

type Props = {
  items: readonly string[]
  /** El texto en negrita: lo que compra confianza y se lee primero, como las promesas de la cédula. */
  strong?: boolean
  className?: string
}

// Lo que se repasa con el tilde en yerba, que es la confianza: cada cosa en su renglón.
export function CheckList({ items, strong = false, className }: Props) {
  return (
    <ul className={cn('flex flex-col gap-3 text-base text-ink', strong && 'font-bold', className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <CheckIcon className="mt-1 size-4 shrink-0 text-primary" />
          {item}
        </li>
      ))}
    </ul>
  )
}
