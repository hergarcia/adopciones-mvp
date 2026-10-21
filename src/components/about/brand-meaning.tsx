import { TextLink } from '@/components/ui/text-link'
import { BrandFigure } from './brand-figure'

export type BrandMeaningTexts = {
  title: string
  paragraphs: string[]
  /** Lo que anuncia el lector de pantalla en lugar del dibujo. */
  image: string
  levels: string
}

type Props = {
  texts: BrandMeaningTexts
  levelsHref: string
}

// En el teléfono el dibujo va arriba de su texto. Desde 1024 lo lleva `AboutClosing` al costado,
// fijo al bajar, así acompaña toda la lectura y llega junto a esta parte.
export function BrandMeaning({ texts, levelsHref }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold tracking-tight text-ink">{texts.title}</h2>
      <div className="flex flex-col gap-10">
        <BrandFigure label={texts.image} className="block lg:hidden" />
        <div className="flex flex-col gap-4">
          {texts.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-base text-ink">
              {paragraph}
            </p>
          ))}
          <TextLink href={levelsHref} prefetch={false} className="self-start">
            {texts.levels}
          </TextLink>
        </div>
      </div>
    </section>
  )
}
