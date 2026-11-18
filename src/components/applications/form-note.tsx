const NOTE = 'bg-surface p-4 text-sm text-ink'

// Un aviso quieto dentro del formulario, sobre piedra y sin borde: dice algo que conviene saber y no
// pide nada (plan §Diseño). Lo usan el de en proceso, el del contacto y, con `live`, el de la
// pregunta propia que cambió mientras escribía, que se anuncia al aparecer.
export function FormNote({
  children,
  live = false,
}: {
  children: React.ReactNode
  live?: boolean
}) {
  if (live) return <output className={`block ${NOTE}`}>{children}</output>
  return <p className={NOTE}>{children}</p>
}
