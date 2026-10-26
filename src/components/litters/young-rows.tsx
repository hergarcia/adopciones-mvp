type Props = {
  /** Ya traducida: «Las crías de La camada de Kira». */
  label: string
  /** Una `YoungRow` por cría, en el orden de la camada. */
  children: React.ReactNode
}

// Toma las columnas de la pared (`subgrid`): cada cría queda debajo de una foto de la fila de arriba.
export function YoungRows({ label, children }: Props) {
  return (
    <ul aria-label={label} className="col-span-full grid grid-cols-subgrid gap-y-6">
      {children}
    </ul>
  )
}
