type Props = {
  /** Ya traducido: «4 crías». */
  count: string
  /** Una `YoungRow` por cría, en el orden de la camada. */
  children: React.ReactNode
}

// Debajo de una camada en «Mis animales» (historia #206, research R9): cuántas crías tiene y una fila
// por cría. Sin miniaturas: la foto de la pared ya es la de la camada.
export function YoungRows({ count, children }: Props) {
  return (
    <div className="flex flex-col gap-1 px-1">
      <p className="text-base font-bold text-ink">{count}</p>
      <ul className="flex flex-col">{children}</ul>
    </div>
  )
}
