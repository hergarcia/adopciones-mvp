import { TextLink } from '@/components/ui/text-link'

type Props = {
  /** Ya traducidos. */
  label: string
  entries: { key: string; href: string; label: string }[]
}

// Las tres entradas sin plazo: Cuentas suspendidas, Opiniones y Encuestas (FR-014).
export function AdminEntries({ label, entries }: Props) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-col">
        {entries.map((entry) => (
          <li key={entry.key}>
            <TextLink href={entry.href}>{entry.label}</TextLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
