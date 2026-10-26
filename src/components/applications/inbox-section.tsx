import { ApplicationList } from './application-list'

type Props = {
  /** Ya traducido: el nombre de la camada, o «Tus otros animales». */
  title: string
  /** Lo que va debajo del título: las sumas de una camada. */
  meta?: React.ReactNode
  /** Ya traducida: la descripción de la lista para un lector de pantalla. */
  label: string
  /** Las `InboxPetCard`. */
  children: React.ReactNode
}

// La línea de arriba cierra el grupo anterior: sin ella, los animales sueltos que siguen a una camada
// se leían como más crías suyas.
export function InboxSection({ title, meta, label, children }: Props) {
  return (
    <section className="flex flex-col gap-4 border-t-2 border-line pt-6">
      <header className="flex flex-col items-start gap-1">
        <h2 className="afiche text-xl break-words text-ink">{title}</h2>
        {meta}
      </header>
      <ApplicationList label={label}>{children}</ApplicationList>
    </section>
  )
}
