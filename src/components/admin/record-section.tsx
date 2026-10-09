import { ShowMoreLink } from '@/components/forms/show-more-link'
import { RecordEntry, type RecordEntryProps } from './record-entry'

type Props = {
  /** El ancla de la parte, a la que vuelve «Ver más». */
  id: string
  /** Ya traducidos: el nombre de la parte y lo que dice vacía. */
  title: string
  empty: string
  /** De lo más nuevo a lo más viejo, ya cortados (FR-036). */
  entries: (RecordEntryProps & { key: string })[]
  more: { href: string; label: string } | null
}

// Una hoja de antecedentes de la ficha: su título, la lista con divisores y «Ver más» si quedan.
export function RecordSection({ id, title, empty, entries, more }: Props) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`} className="text-lg font-bold text-ink">
        {title}
      </h2>
      {entries.length === 0 ? (
        <p className="mt-2 text-base text-ink-muted">{empty}</p>
      ) : (
        <ul className="mt-2 divide-y-2 divide-line">
          {entries.map(({ key, ...entry }) => (
            <li key={key} className="py-4 first:pt-2">
              <RecordEntry {...entry} />
            </li>
          ))}
        </ul>
      )}
      {more === null ? null : <ShowMoreLink href={more.href} label={more.label} />}
    </section>
  )
}
