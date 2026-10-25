import { BrandEquation, type BrandEquationTexts } from './brand-equation'

export type BrandMeaningTexts = {
  title: string
  lead: string
  equation: BrandEquationTexts
  /** Lo que anuncia el lector de pantalla en lugar de la marca de la suma. */
  image: string
}

// La suma va después de la bajada, que cuenta las dos huellas: el dibujo la cierra.
export function BrandMeaning({ texts }: { texts: BrandMeaningTexts }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold tracking-tight text-ink">{texts.title}</h2>
      <p className="text-base text-ink">{texts.lead}</p>
      <div className="pt-6">
        <BrandEquation texts={texts.equation} markLabel={texts.image} />
      </div>
    </section>
  )
}
