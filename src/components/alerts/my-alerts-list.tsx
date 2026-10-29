type Props = {
  /** Ya traducido, para quien lee la lista con lector de pantalla. */
  label: string
  /** Las filas (`MyAlertRow`), del aviso más viejo al más nuevo. */
  children: React.ReactNode
}

// «Mis avisos»: una lista de trabajo con divisores de `--color-line`, como «Mis bloqueos». Sin
// filas, la página pinta su vacío.
export function MyAlertsList({ label, children }: Props) {
  return (
    <section aria-label={label}>
      <ul className="border-t-2 border-line">{children}</ul>
    </section>
  )
}
