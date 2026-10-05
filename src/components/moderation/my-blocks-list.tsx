import { PersonList } from '@/components/profile/person-list'

type Props = {
  /** Ya traducido, para quien lee la lista con lector de pantalla. */
  label: string
  /** Las filas (`MyBlockRow`), del bloqueo más reciente al más viejo. */
  children: React.ReactNode[]
}

// «Mis bloqueos» (FR-017b): una lista de gente con divisores, como «Mis avales», que desde 1024 se
// reparte en columnas como los avales del perfil. Sin filas, la página pinta su vacío.
export function MyBlocksList({ label, children }: Props) {
  return (
    <section aria-label={label}>
      <PersonList className="grid lg:grid-cols-3 lg:gap-x-8">{children}</PersonList>
    </section>
  )
}
