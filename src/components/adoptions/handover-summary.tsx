import { CommitmentDates } from './commitment-dates'
import { CommitmentText } from './commitment-text'

export type HandoverSummaryTexts = {
  /** «Ana dijo que no lo adoptó»: el sello de la cerrada no lo dice. Nulo en curso o terminada. */
  declined: string | null
  /** Sin él, la persona dijo que no lo adoptó (FR-021). */
  commitment: {
    title: string
    clauses: string[]
    note: string
    /** El día en que aceptó cada una y, si falta, «Compromiso pendiente de Ana». */
    dates: { accepted: string[]; pending: string | null }
  } | null
}

// La elegida, para quien lo dio (plan §Una solicitud, para el publicador): el compromiso con sus
// fechas, a la medida de lectura. A quién y cuándo ya lo dicen el nombre y el sello «Adoptó» de
// arriba; solo pinta: qué va lo decide el servidor con `adoption_of`.
export function HandoverSummary({ texts }: { texts: HandoverSummaryTexts }) {
  return (
    <section className="flex flex-col gap-4">
      {texts.declined === null ? null : <p className="text-base text-ink">{texts.declined}</p>}
      {texts.commitment === null ? null : (
        <>
          <h2 className="text-lg font-medium text-ink">{texts.commitment.title}</h2>
          <CommitmentText clauses={texts.commitment.clauses} note={texts.commitment.note} />
          <CommitmentDates
            accepted={texts.commitment.dates.accepted}
            pending={texts.commitment.dates.pending}
            urgent={false}
          />
        </>
      )}
    </section>
  )
}
