import { cn } from '@/lib/cn'

type Props = {
  /** Lo que se muestra de la persona. */
  details: React.ReactNode
  /** Las dos imágenes; nulas en el pedido propio, que no se muestra (FR-020). */
  images: React.ReactNode | null
  /** La regla y lo que se decide. */
  decision: React.ReactNode
}

// La grilla de un pedido, para la vista y para su `loading`. Desde 1024, la cédula y la selfie lado a
// lado a la misma altura, porque comparar las dos caras es la decisión; debajo, los datos a la
// izquierda y lo que se decide a la derecha, sin scroll entre la foto y el botón.
export function ReviewRequestLayout({ details, images, decision }: Props) {
  const hasImages = images !== null
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-x-10">
      <section className={cn(hasImages && 'lg:row-start-2')}>{details}</section>

      {hasImages ? (
        <div className="grid gap-6 border-t-2 border-line pt-6 lg:col-span-2 lg:row-start-1 lg:grid-cols-2 lg:gap-x-10 lg:border-t-0 lg:pt-0">
          {images}
        </div>
      ) : null}

      <div className={cn('flex flex-col gap-6 lg:col-start-2', hasImages && 'lg:row-start-2')}>
        {decision}
      </div>
    </div>
  )
}
