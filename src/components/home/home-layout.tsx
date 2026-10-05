type Props = {
  hero: React.ReactNode
  rescuer: React.ReactNode
  adopter: React.ReactNode
  recent: React.ReactNode
}

// El DOM sigue el orden de la historia (frase, pasos, verificado, animales) y un lector de pantalla
// lo lee así en todos los anchos. Desde 1024 el bloque de quien adopta sube al lado de la frase sin
// moverse en el DOM, para que el afiche llene la hoja (plan §Orden).
export function HomeLayout({ hero, rescuer, adopter, recent }: Props) {
  return (
    <div className="grid gap-y-12 lg:grid-cols-12 lg:gap-x-8">
      <div className="lg:col-span-7 lg:row-start-1">{hero}</div>
      <div className="lg:col-span-12 lg:row-start-2">{rescuer}</div>
      <div className="lg:col-span-5 lg:col-start-8 lg:row-start-1">{adopter}</div>
      <div className="lg:col-span-12 lg:row-start-3">{recent}</div>
    </div>
  )
}
