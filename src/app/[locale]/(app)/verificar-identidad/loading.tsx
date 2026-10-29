import { Skeleton } from '@/components/ui/skeleton'
import { SingleTaskLayout } from '@/app/[locale]/_components/single-task-layout'

// La forma del primer paso: el título, la bajada, las dos secciones del consentimiento con la nota
// y la letra chica, el enlace a «Cómo se verifica», la tirita y «Ahora no». Con la altura real: si
// fuera más corta, el pie del sitio quedaría a la vista mientras carga y saltaría al llegar el
// contenido (SC-010 de la #11).
export default function Loading() {
  return (
    <SingleTaskLayout
      presentation={
        <>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-3 h-12 w-full" />
          <Skeleton className="mt-8 h-6 w-40" />
          <Skeleton className="mt-2 h-12 w-full" />
          <Skeleton className="mt-6 h-6 w-48" />
          <Skeleton className="mt-6 h-60 w-full" />
          <Skeleton className="mt-6 h-48 w-full" />
          <Skeleton className="mt-4 h-11 w-72" />
        </>
      }
      task={
        <>
          <Skeleton className="mt-10 h-14 w-full" />
          <Skeleton className="mt-4 h-11 w-24" />
        </>
      }
    />
  )
}
