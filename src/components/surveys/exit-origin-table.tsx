type Props = {
  /** Ya traducidos: lo que dice la tabla, solo para un lector de pantalla, y el nombre de la primera columna. */
  texts: { caption: string; optionHeader: string }
  /** Los orígenes, ya traducidos, en el orden de las columnas. */
  origins: { key: string; label: string }[]
  /** Una fila por opción, con un número por origen en el mismo orden que `origins`. */
  rows: { key: string; label: string; counts: number[] }[]
}

// Cuántas veces se eligió cada opción según desde dónde llegó la persona (historia #234, plan
// §Diseño Encuestas): una tabla de verdad, porque se lee cruzando la opción con el origen. Sin fondo,
// cebra ni color; con todo en cero muestra ceros, y la frase del vacío la dice el bloque.
export function ExitOriginTable({ texts, origins, rows }: Props) {
  return (
    <table className="w-full border-collapse text-sm text-ink">
      <caption className="sr-only">{texts.caption}</caption>
      <thead>
        <tr className="border-b border-line">
          <th scope="col" className="pb-2 text-left">
            <span className="sr-only">{texts.optionHeader}</span>
          </th>
          {origins.map((origin) => (
            <th
              key={origin.key}
              scope="col"
              className="pb-2 pl-4 text-right align-bottom font-medium text-ink-muted"
            >
              {origin.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-b border-line last:border-b-0">
            <th scope="row" className="py-2 text-left font-normal break-words">
              {row.label}
            </th>
            {row.counts.map((count, index) => (
              <td key={origins[index]?.key ?? index} className="py-2 pl-4 text-right tabular-nums">
                {count}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
