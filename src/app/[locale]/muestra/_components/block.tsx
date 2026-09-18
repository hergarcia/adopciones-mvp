type Props = {
  title: string
  children: React.ReactNode
}

// El envoltorio de cada bloque de la muestra. Existe porque son once repeticiones del mismo
// patrón, y docs/08 manda extraer en la segunda.
export function Block({ title, children }: Props) {
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-6">
      <h2 className="text-xl font-medium tracking-tight text-ink">{title}</h2>
      {children}
    </section>
  )
}
