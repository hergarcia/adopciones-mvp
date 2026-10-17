import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = {
  presentation: React.ReactNode
  task: React.ReactNode
}

// Columnas iguales para que la tarea arranque pasada la mitad de la hoja; el primer hijo de la
// tarea pierde su margen del teléfono para que las dos partes empiecen en el mismo renglón.
export function SingleTaskLayout({ presentation, task }: Props) {
  return (
    <PageShell width="wide">
      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-16">
        <div className="lg:sticky lg:top-6">{presentation}</div>
        <div className="lg:[&>:first-child]:mt-0">{task}</div>
      </div>
    </PageShell>
  )
}
