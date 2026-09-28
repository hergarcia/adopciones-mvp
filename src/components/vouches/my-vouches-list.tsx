type Props = {
  title: string
  /** Las filas (`MyVouchRow`), del aval más reciente al más viejo. */
  children: React.ReactNode[]
  /** Lo que se dibuja sin filas: el vacío de esta lista, aunque la otra tenga. */
  empty: React.ReactNode
}

// Una de las dos listas de «Mis avales»: texto con divisores, como la cola de revisión. Es una lista
// de gente, no un muro de tarjetas.
export function MyVouchesList({ title, children, empty }: Props) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {children.length === 0 ? (
        empty
      ) : (
        <ul className="divide-y-2 divide-line border-y-2 border-line">{children}</ul>
      )}
    </section>
  )
}
