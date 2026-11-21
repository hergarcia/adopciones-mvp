type Row = {
  key: string
  /** La opción, ya traducida. */
  label: string
  total: number
  /** De 0 a 1: el largo de la barra. */
  share: number
  isTop: boolean
  /** Un número por origen, en el mismo orden que `origins`. */
  counts: number[]
}

type Props = {
  /** Ya traducidos: lo que dice la tabla, solo para un lector de pantalla, y los nombres de la opción y del total. */
  texts: { caption: string; optionHeader: string; totalHeader: string }
  /** Los orígenes, ya traducidos, en el orden de las columnas. */
  origins: { key: string; label: string }[]
  rows: Row[]
}

// Una sola lectura de cada opción: su barra, el total y el total partido por origen. Es una tabla de
// verdad porque se lee cruzando la opción con el origen; la barra es un dibujo y el lector de
// pantalla lee el total. Con todo en cero muestra ceros: la frase del vacío la dice el bloque.
export function ExitOriginTable({ texts, origins, rows }: Props) {
  return (
    <table className="w-full border-collapse text-sm text-ink">
      <caption className="sr-only">{texts.caption}</caption>
      <thead>
        <tr className="border-b border-line">
          <th scope="col" className="pb-2 text-left">
            <span className="sr-only">{texts.optionHeader}</span>
          </th>
          {[{ key: 'total', label: texts.totalHeader }, ...origins].map((column) => (
            <th
              key={column.key}
              scope="col"
              className="pb-2 pl-3 text-right align-bottom font-medium text-ink-muted"
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-b border-line last:border-b-0">
            <th scope="row" className="py-2 text-left align-top font-regular break-words">
              {row.label}
              <svg
                aria-hidden
                viewBox="0 0 100 1"
                preserveAspectRatio="none"
                className="mt-1 block h-2 w-full"
              >
                {row.share > 0 ? (
                  <rect
                    width={row.share * 100}
                    height="1"
                    className={row.isTop ? 'fill-ink' : 'fill-line'}
                  />
                ) : null}
              </svg>
            </th>
            <td className="py-2 pl-3 text-right align-top font-bold tabular-nums">{row.total}</td>
            {row.counts.map((count, index) => (
              <td
                key={origins[index]?.key ?? index}
                className="py-2 pl-3 text-right align-top tabular-nums"
              >
                {count}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
