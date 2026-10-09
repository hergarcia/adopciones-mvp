type Bar = {
  key: string
  /** La opción, ya traducida. */
  label: string
  chosen: number
  /** De 0 a 1. */
  share: number
  isTop: boolean
}

type Props = {
  bars: Bar[]
  /** Ya traducido: lo que es la lista para un lector de pantalla. */
  label: string
}

// Cuántas veces se eligió cada opción (plan §Diseño Encuestas): renglones con una barra de tinta
// proporcional y el número, que es lo que la barra dice. La más elegida va en tinta llena y las
// demás en `--color-line`; sin números grandes con etiqueta chica. La barra es un dibujo: el lector
// de pantalla lee la opción y el número.
export function SurveyOptionBars({ bars, label }: Props) {
  return (
    <ul aria-label={label} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2">
      {bars.map((bar) => (
        <li key={bar.key} className="col-span-3 grid grid-cols-subgrid items-center">
          <span className="text-sm text-ink">{bar.label}</span>
          <svg aria-hidden viewBox="0 0 100 1" preserveAspectRatio="none" className="h-3 w-full">
            {bar.share > 0 ? (
              <rect
                width={bar.share * 100}
                height="1"
                className={bar.isTop ? 'fill-ink' : 'fill-line'}
              />
            ) : null}
          </svg>
          <span className="text-sm text-ink tabular-nums">{bar.chosen}</span>
        </li>
      ))}
    </ul>
  )
}
