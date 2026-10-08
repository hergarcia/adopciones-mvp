import { CommitmentText } from './commitment-text'

export type HandoverSummaryTexts = {
  /** «Se lo diste a Ana el 8 de octubre», o «Ana dijo que no lo adoptó». */
  given: string
  /** Sin él, la persona dijo que no lo adoptó (FR-021). */
  commitment: {
    title: string
    clauses: string[]
    note: string
    /** «Compromiso pendiente de Ana» o «Compromiso aceptado el 9 de octubre». */
    state: string
  } | null
}

// La elegida, para quien lo dio (plan §Una solicitud, para el publicador): a quién y cuándo, y el
// compromiso con su estado. Solo pinta: qué va lo decide el servidor con `adoption_of`.
export function HandoverSummary({ texts }: { texts: HandoverSummaryTexts }) {
  return (
    <section className="flex flex-col gap-4">
      <p className="text-base text-ink">{texts.given}</p>
      {texts.commitment === null ? null : (
        <>
          <h2 className="text-lg font-medium text-ink">{texts.commitment.title}</h2>
          <CommitmentText clauses={texts.commitment.clauses} note={texts.commitment.note} />
          <p className="text-sm text-ink-muted">{texts.commitment.state}</p>
        </>
      )}
    </section>
  )
}
