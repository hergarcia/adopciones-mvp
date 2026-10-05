type Props = {
  /** Ya traducido: el motivo, lo que llama la atención en cada reporte. */
  reason: string
  /** «Sobre Ana», con el enlace a su perfil o la marca de suspendida. */
  about: React.ReactNode
  /** «Hace 2 días». */
  age: string
  /** El texto de quien reportó, ya entre comillas, o nulo. */
  details: string | null
  /** «Lo reportó Marta», con la marca de suspendida si hace falta. */
  reporter: React.ReactNode
  history: React.ReactNode
  decision: React.ReactNode
}

// Un reporte de la lista (plan §Reportes): el motivo en voz de afiche, sobre quién, cuándo, el
// texto, quién lo hizo, los antecedentes y las acciones, en la medida de lectura.
export function ReportItem({ reason, about, age, details, reporter, history, decision }: Props) {
  return (
    <article className="flex max-w-[var(--measure)] flex-col gap-2">
      <h2 className="afiche text-xl text-ink">{reason}</h2>
      <div className="text-base text-ink">{about}</div>
      <p className="text-sm text-ink-muted tabular-nums">{age}</p>
      {details === null ? null : <p className="text-base text-ink">{details}</p>}
      <div className="text-sm text-ink-muted">{reporter}</div>
      <div className="mt-2 flex flex-col gap-4">
        {history}
        {decision}
      </div>
    </article>
  )
}
