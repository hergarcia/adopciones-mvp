import { BrandFigure } from './brand-figure'

type Props = {
  /** Lo que anuncia el lector de pantalla en lugar del dibujo. */
  image: string
  /** El cierre de siempre: la fecha y la acción. */
  children: React.ReactNode
}

// «Nosotros» no tiene preguntas relacionadas que llenen el costado: desde 1024 lo encabeza la marca,
// que así queda a la vista durante toda la lectura (docs/11, 2026-09-20 #21: nada de una columna
// perdida en el vacío). En el teléfono la marca va con su parte y acá queda solo el cierre.
export function AboutClosing({ image, children }: Props) {
  return (
    <div className="flex flex-col gap-10">
      <BrandFigure label={image} className="hidden lg:block" />
      {children}
    </div>
  )
}
