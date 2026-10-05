import { LinkButton } from '@/components/ui/link-button'
import { LISTING_PATH, PUBLISH_PATH } from '@/lib/pets/paths'

export type HomeHeroTexts = { title: string; publish: string; browse: string }

// Sin prefetch: traer publicar por adelantado correría su puerta y contaría un toque que nadie hizo,
// y traer el listado contaría una visita (research R4, R6).
export function HomeHero({ texts }: { texts: HomeHeroTexts }) {
  return (
    <div>
      <h1 className="afiche max-w-[var(--measure)] text-4xl text-ink">{texts.title}</h1>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <LinkButton
          href={PUBLISH_PATH}
          variant="tirita"
          size="lg"
          prefetch={false}
          className="sm:w-auto"
        >
          {texts.publish}
        </LinkButton>
        <LinkButton href={LISTING_PATH} variant="secondary" size="lg" prefetch={false}>
          {texts.browse}
        </LinkButton>
      </div>
    </div>
  )
}
