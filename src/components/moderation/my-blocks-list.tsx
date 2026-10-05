import { PersonList } from '@/components/profile/person-list'

type Props = {
  /** Ya traducido, para quien lee la lista con lector de pantalla. */
  label: string
  /** Las filas (`MyBlockRow`), del bloqueo más reciente al más viejo. */
  children: React.ReactNode[]
  /** `MyBlocksEmpty`, sin filas. */
  empty: React.ReactNode
}

// «Mis bloqueos» (FR-017b): una lista de gente con divisores, como «Mis avales».
export function MyBlocksList({ label, children, empty }: Props) {
  if (children.length === 0) return empty
  return (
    <section aria-label={label} className="max-w-[var(--measure)]">
      <PersonList>{children}</PersonList>
    </section>
  )
}
