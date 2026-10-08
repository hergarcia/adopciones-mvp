type Props = {
  /** Ya traducidas: «Rocío lo aceptó el 8 de octubre», una por persona que aceptó. */
  accepted: string[]
  /** «Compromiso pendiente», o nada si las dos lo aceptaron. */
  pending: string | null
  /** Del lado de quien adoptó, lo pendiente le toca a ella: en mate cocido (plan §Tokens). */
  urgent: boolean
}

// El día en que aceptó cada una (FR-014), debajo del compromiso, en chico.
export function CommitmentDates({ accepted, pending, urgent }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {accepted.map((line) => (
        <p key={line} className="text-sm text-ink-muted">
          {line}
        </p>
      ))}
      {pending === null ? null : (
        <p className={urgent ? 'text-sm font-medium text-warning' : 'text-sm text-ink-muted'}>
          {pending}
        </p>
      )}
    </div>
  )
}
