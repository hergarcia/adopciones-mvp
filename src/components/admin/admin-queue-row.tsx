import Link from 'next/link'
import { Stamp } from '@/components/ui/stamp'
import { rowLinkTitle } from '@/components/ui/text-link'
import { cn } from '@/lib/cn'

export type AdminQueueRowProps = {
  href: string
  /** Ya traducidos: el nombre de la cola y la frase de cuántos y desde cuándo. */
  title: string
  line: string
  /** «Atrasada por 1 día», solo en la atrasada. */
  overdue: string | null
  /** La frase en `ink-muted`: nada esperando, o no se pudo contar. */
  quiet: boolean
}

// Un renglón de la tabla de avisos: la cola, cuánto espera y desde cuándo, y el sello si se pasó de
// plazo. El renglón entero lleva a la lista, también cuando no se pudo contar (FR-016).
export function AdminQueueRow({ href, title, line, overdue, quiet }: AdminQueueRowProps) {
  return (
    <Link href={href} className="press group flex flex-col gap-2 py-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h2 className={cn(rowLinkTitle(), 'text-lg font-bold')}>{title}</h2>
        {overdue === null ? null : <Stamp tone="warning">{overdue}</Stamp>}
      </div>
      <p className={cn('max-w-[var(--measure)] text-base', quiet ? 'text-ink-muted' : 'text-ink')}>
        {line}
      </p>
    </Link>
  )
}
