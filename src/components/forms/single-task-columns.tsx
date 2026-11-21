type Props = {
  presentation: React.ReactNode
  task: React.ReactNode
}

// Las dos partes de una pantalla de una sola tarea (docs/10 §Pantallas anchas), para la pantalla que
// cambia entera sin navegar y no puede dejar su grilla en la página. Columnas iguales para que la
// tarea arranque pasada la mitad de la hoja; el primer hijo de la tarea pierde su margen del teléfono
// para que las dos partes empiecen en el mismo renglón.
export function SingleTaskColumns({ presentation, task }: Props) {
  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-16">
      <div className="lg:sticky lg:top-6">{presentation}</div>
      <div className="lg:[&>:first-child]:mt-0">{task}</div>
    </div>
  )
}
