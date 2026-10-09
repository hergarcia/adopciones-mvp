import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { TextLink } from '@/components/ui/text-link'

export type ReviewQueueRow = {
  id: string
  name: string
  /** La ficha de la persona (historia #73). */
  recordHref: string
  /** Ya con la fecha: «Espera desde el …». */
  waitingSince: string
  /** Ya con la fecha y la hora: «Vence el … a las …». */
  expires: string
  isOwn: boolean
}

type Props = {
  rows: ReviewQueueRow[]
  texts: { open: string; own: string; empty: string; back: string }
  hrefs: { request: (id: string) => string; back: string }
}

// La cola, del más viejo al más nuevo (FR-014): texto con divisores, sin imágenes y sin cards, que
// es una lista de trabajo y no notas pegadas. El nombre lleva a la ficha de la persona; el resto de
// la fila, a su pedido. La propia no lleva al pedido, porque no se puede resolver (FR-020).
export function ReviewQueueList({ rows, texts, hrefs }: Props) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={texts.empty}
        action={
          <LinkButton href={hrefs.back} variant="secondary">
            {texts.back}
          </LinkButton>
        }
      />
    )
  }

  return (
    <ul className="divide-y-2 divide-line border-y-2 border-line">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex flex-col gap-1 py-2 md:flex-row md:items-baseline md:gap-6"
        >
          <span className="md:w-56">
            <TextLink href={row.recordHref} weight="medium">
              {row.name}
            </TextLink>
          </span>
          {row.isOwn ? (
            <span className="text-sm text-ink-muted">{texts.own}</span>
          ) : (
            <Link
              href={hrefs.request(row.id)}
              className="press group flex flex-col gap-1 pb-2 md:flex-1 md:flex-row md:items-baseline md:gap-6 md:pb-0"
            >
              <span className="text-sm text-ink-muted tabular-nums md:w-56">
                {row.waitingSince}
              </span>
              <span className="text-sm text-ink-muted tabular-nums md:flex-1">{row.expires}</span>
              <span className="afiche text-base text-ink underline decoration-transparent decoration-2 underline-offset-4 transition-[text-decoration-color] duration-[var(--dur-fast)] group-hover:decoration-ink">
                {texts.open}
              </span>
            </Link>
          )}
        </li>
      ))}
    </ul>
  )
}
