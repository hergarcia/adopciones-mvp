import { LinkButton } from '@/components/ui/link-button'
import type { BadgeLevel } from '@/lib/verification/badge-parts'
import { LevelCard, type LevelCardTexts } from './level-card'

type Props = {
  /** Ya traducidos. */
  texts: { title: string; lead: string; back: string }
  levels: { level: BadgeLevel; texts: LevelCardTexts }[]
  /** El nivel que se tocó, o nulo desde un perfil sin nivel. */
  highlighted: BadgeLevel | null
  backHref: string
}

// La explicación de los niveles: los tres juntos, lado a lado desde 1024, para compararlos. Sin
// tirita: no hay un próximo paso, solo volver a donde se estaba.
export function LevelsExplanation({ texts, levels, highlighted, backHref }: Props) {
  return (
    <>
      <h1 className="afiche text-2xl text-ink">{texts.title}</h1>
      <p className="mt-2 max-w-[var(--measure)] text-base text-ink-muted">{texts.lead}</p>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {levels.map(({ level, texts: card }) => (
          <LevelCard key={level} level={level} texts={card} highlighted={level === highlighted} />
        ))}
      </div>
      <LinkButton href={backHref} variant="ghost" className="mt-8">
        {texts.back}
      </LinkButton>
    </>
  )
}
