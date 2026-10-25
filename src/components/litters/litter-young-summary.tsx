type Props = {
  /** Ya traducidos: «4 crías» y una línea por cría, «Cría 1, hembra». */
  texts: { count: string; young: { key: string; line: string }[] }
}

// Debajo de la camada en «Mis animales»: cuántas crías tiene y cuáles, en texto, sin miniaturas
// (plan §Mis animales). La foto de la pared es la de la camada.
export function LitterYoungSummary({ texts }: Props) {
  return (
    <div className="flex flex-col gap-1 px-1">
      <p className="text-base font-bold text-ink">{texts.count}</p>
      <ul className="flex flex-col text-sm text-ink-muted">
        {texts.young.map((one) => (
          <li key={one.key} className="break-words">
            {one.line}
          </li>
        ))}
      </ul>
    </div>
  )
}
