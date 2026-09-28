type Props = {
  /** Cada renglón ya traducido: el animal y su salud, y con quién convive. */
  lines: string[]
  /** El nombre accesible de la lista, ya traducido. */
  label: string
}

// Todos los datos de la ficha, también el «no» y el «no se sabe» (FR-006, research R13), dichos como
// los diría el cartel: frases cortas en dos renglones de lectura, no una tabla de etiqueta y valor
// (docs/10 §Principios 1).
export function PetFacts({ lines, label }: Props) {
  return (
    <ul aria-label={label} className="flex flex-col gap-1">
      {lines.map((line) => (
        <li key={line} className="text-base text-ink">
          {line}
        </li>
      ))}
    </ul>
  )
}
