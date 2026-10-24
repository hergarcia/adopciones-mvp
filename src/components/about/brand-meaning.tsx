import { TextLink } from '@/components/ui/text-link'
import { BrandEquation, type BrandEquationTexts } from './brand-equation'
import { BrandSenses, type BrandSensesTexts } from './brand-senses'

export type BrandMeaningTexts = {
  title: string
  lead: string
  equation: BrandEquationTexts
  support: string
  senses: BrandSensesTexts
  closing: string[]
  /** Lo que anuncia el lector de pantalla en lugar de la marca, en la suma y al costado. */
  image: string
  levels: string
}

type Props = {
  texts: BrandMeaningTexts
  levelsHref: string
}

// La suma va antes que lo que la explica, porque se entiende sin leer. En el teléfono es la única
// vez que se ve la marca grande; desde 1024 la acompaña la de `AboutClosing` al costado.
export function BrandMeaning({ texts, levelsHref }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold tracking-tight text-ink">{texts.title}</h2>
      <p className="text-base text-ink">{texts.lead}</p>
      <div className="py-6">
        <BrandEquation texts={texts.equation} markLabel={texts.image} />
      </div>
      <p className="text-base text-ink">{texts.support}</p>
      <div className="py-2">
        <BrandSenses texts={texts.senses} />
      </div>
      {texts.closing.map((paragraph) => (
        <p key={paragraph} className="text-base text-ink">
          {paragraph}
        </p>
      ))}
      <TextLink href={levelsHref} prefetch={false} className="self-start">
        {texts.levels}
      </TextLink>
    </section>
  )
}
