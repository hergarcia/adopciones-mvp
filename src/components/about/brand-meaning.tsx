import { BrandMark } from '@/components/ui/brand-mark'
import { TextLink } from '@/components/ui/text-link'

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

// La única vez que la marca aparece grande: la principal a 128 px, sola, quieta y en tinta (docs/10
// §Marca). Acá el dibujo es el tema y no hay nombre al lado, así que deja de ser decorativo y se
// anuncia con lo que representa. El SVG va inline con su alto fijo: el texto no se corre (FR-024).
export function BrandMeaning({ texts, levelsHref }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold tracking-tight text-ink">{texts.title}</h2>
      <div className="grid gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
        <BrandMark
          version="principal"
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- un SVG inline en currentColor no puede ser un <img>; role="img" es su forma accesible
          role="img"
          aria-label={texts.image}
          aria-hidden={false}
          className="block h-32 w-auto text-ink"
        />
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
