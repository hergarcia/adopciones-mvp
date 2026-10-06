type Props = {
  /** Ya traducidos: «Activas» y la descripción de la lista para un lector de pantalla. */
  title: string
  label: string
  children: React.ReactNode
}

// Un grupo de Mis solicitudes con su título: las activas, o las cerradas y retiradas (FR-071).
export function ApplicationList({ title, label, children }: Props) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium text-ink">{title}</h2>
      <ul aria-label={label} className="border-t-2 border-line">
        {children}
      </ul>
    </section>
  )
}
