type Props = {
  /** Cada dato con su etiqueta y su valor, ya traducidos y en palabras. */
  facts: { label: string; value: string }[]
  /** El nombre accesible de la lista, ya traducido. */
  label: string
}

// Todos los datos de la ficha, también el «no» y el «no se sabe» (FR-006, research R13): una lista
// de definiciones en dos columnas de texto, la etiqueta en gris y el valor en tinta. No son
// etiquetas con borde: informan, y todas pesan igual.
export function PetFacts({ facts, label }: Props) {
  return (
    <dl aria-label={label} className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-2">
      {facts.map((fact) => (
        <div key={fact.label} className="contents">
          <dt className="text-sm text-ink-muted">{fact.label}</dt>
          <dd className="text-base text-ink">{fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}
