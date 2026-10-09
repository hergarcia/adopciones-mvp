type Props = {
  /** El ancla de «Ver más»: la vista vuelve a esta opinión. */
  id: string
  body: string
  /** El día y la pantalla en un renglón, ya armados. */
  meta: React.ReactNode
  /** «Borrar». */
  action: React.ReactNode
}

// Una opinión en Opiniones (plan §Diseño Opiniones): el texto manda, en la medida de lectura; el día
// y la pantalla debajo, en secundario. «Borrar» va contra el borde derecho, donde termina el divisor:
// en 1280, al final de una columna de 640, flotaba en el medio de la hoja. Sin card: es una nota del
// buzón abierto.
export function FeedbackEntry({ id, body, meta, action }: Props) {
  return (
    <article id={id} className="flex scroll-mt-4 flex-col gap-2">
      <p className="max-w-[var(--measure)] text-base break-words whitespace-pre-line text-ink">
        {body}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        <p className="text-sm text-ink-muted">{meta}</p>
        {action}
      </div>
    </article>
  )
}
