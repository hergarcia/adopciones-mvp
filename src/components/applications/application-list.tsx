import { petWall } from '@/components/pets/pet-wall'

type Props = {
  /** Ya traducidos: «Activas», o nada en el límite, y la descripción para un lector de pantalla. */
  title?: string
  label: string
  /** Las `MyApplicationCard`. */
  children: React.ReactNode
}

// Las solicitudes como la pared del listado: dos columnas, tres desde 768 y cuatro desde 1024, así la
// hoja ancha se llena de animales y no de una columna (docs/10 §Pantallas anchas). Con título, un
// grupo de Mis solicitudes (FR-071).
export function ApplicationList({ title, label, children }: Props) {
  const wall = (
    <ul aria-label={label} className={petWall({ columns: 'wall' })}>
      {children}
    </ul>
  )
  if (title === undefined) return wall
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium text-ink">{title}</h2>
      {wall}
    </section>
  )
}
