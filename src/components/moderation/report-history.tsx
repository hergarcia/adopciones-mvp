import { Disclosure } from '@/components/ui/disclosure'

export type ReportHistoryLine = {
  key: string
  /** Ya traducido: el motivo del reporte, o la suspensión con sus fechas. */
  title: string
  /** Ya traducidos: cómo se cerró, el motivo de la suspensión, quién suspendió. */
  lines: string[]
}

type Props = {
  entries: ReportHistoryLine[]
  texts: { title: string; empty: string }
}

// Los antecedentes de la persona reportada, de lo más nuevo a lo más viejo (FR-008): abiertos si
// hay, porque es lo que quien administra necesita para decidir; «Sin antecedentes» si no.
export function ReportHistory({ entries, texts }: Props) {
  if (entries.length === 0) return <p className="text-sm text-ink-muted">{texts.empty}</p>
  return (
    <Disclosure label={texts.title} open>
      <ul className="mt-2 flex flex-col divide-y-2 divide-line bg-surface px-4">
        {entries.map((entry) => (
          <li key={entry.key} className="flex flex-col gap-1 py-3">
            <p className="text-base text-ink">{entry.title}</p>
            {entry.lines.map((text) => (
              <p key={text} className="text-sm text-ink-muted">
                {text}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </Disclosure>
  )
}
