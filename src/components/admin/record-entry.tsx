import { Stamp } from '@/components/ui/stamp'
import { TextLink } from '@/components/ui/text-link'
import { cn } from '@/lib/cn'

export type RecordEntryProps = {
  /** Ya traducidos: la línea principal y, si hay, el texto citado y los metadatos. */
  title: string
  detail?: string | null
  meta?: string | null
  /** «Sin resolver» o «Por revisar». */
  stamp?: string | null
  /** A donde se resuelve, si quien mira puede. */
  href?: string | null
  /** La línea principal en `ink-muted`: lo que espera a otra persona que administre. */
  quiet?: boolean
}

// Un antecedente de la ficha: una línea que dice qué fue, lo citado si lo hay y cuándo, en texto de
// lectura. El mismo para las cuatro partes.
export function RecordEntry({ title, detail, meta, stamp, href, quiet }: RecordEntryProps) {
  return (
    <div className="flex max-w-[var(--measure)] flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {href ? (
          <TextLink href={href} weight="medium">
            {title}
          </TextLink>
        ) : (
          <p className={cn('text-base', quiet ? 'text-ink-muted' : 'text-ink')}>{title}</p>
        )}
        {stamp ? <Stamp tone="muted">{stamp}</Stamp> : null}
      </div>
      {detail ? <p className="text-base break-words text-ink">{detail}</p> : null}
      {meta ? <p className="text-sm text-ink-muted">{meta}</p> : null}
    </div>
  )
}
