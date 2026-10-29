type Props = {
  /** Ya traducido, para quien lee la lista con lector de pantalla. */
  label: string
  /** Las filas (`MyAlertRow`), del aviso más viejo al más nuevo. */
  children: React.ReactNode
}

// Cada fila cierra con su divisor, así la línea sigue a la columna desde 1024.
export function MyAlertsList({ label, children }: Props) {
  return (
    <section aria-label={label}>
      <ul className="grid border-t-2 border-line lg:grid-cols-3 lg:gap-x-8">{children}</ul>
    </section>
  )
}
