import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/link-button'

export type ReviewQueueRow = {
  id: string
  name: string
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
// es una lista de trabajo y no notas pegadas. Cada fila es un enlace a su pedido; la propia no,
// porque no se puede resolver (FR-020).
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
      {rows.map((row) =>
        row.isOwn ? (
          <li key={row.id} className="flex flex-col gap-1 py-4 md:flex-row md:gap-6">
            <span className="text-base font-medium text-ink md:w-56">{row.name}</span>
            <span className="text-sm text-ink-muted">{texts.own}</span>
          </li>
        ) : (
          <li key={row.id}>
            <Link
              href={hrefs.request(row.id)}
              className="group flex flex-col gap-1 py-4 md:flex-row md:items-baseline md:gap-6"
            >
              <span className="text-base font-medium text-ink underline decoration-transparent decoration-2 underline-offset-4 transition-[text-decoration-color] duration-[var(--dur-fast)] group-hover:decoration-ink md:w-56">
                {row.name}
              </span>
              <span className="text-sm text-ink-muted tabular-nums md:w-56">
                {row.waitingSince}
              </span>
              <span className="text-sm text-ink-muted tabular-nums md:flex-1">{row.expires}</span>
              <span className="afiche text-base text-ink">{texts.open}</span>
            </Link>
          </li>
        ),
      )}
    </ul>
  )
}
