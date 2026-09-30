import { LinkButton } from '@/components/ui/link-button'
import type { BadgeLevel } from '@/lib/verification/badge-parts'
import { LevelStep, type LevelStepTexts } from './level-step'

type Props = {
  /** Ya traducidos. */
  texts: { title: string; lead: string; back: string }
  levels: { level: BadgeLevel; texts: LevelStepTexts }[]
  /** El nivel que se tocó, o nulo desde un perfil sin nivel. */
  highlighted: BadgeLevel | null
  backHref: string
}

// La explicación de los niveles: una escalera, no tres opciones para elegir; cada escalón suma al
// anterior. Sin tirita: no hay un próximo paso, solo volver a donde se estaba.
export function LevelsExplanation({ texts, levels, highlighted, backHref }: Props) {
  return (
    <>
      <h1 className="afiche text-2xl text-ink">{texts.title}</h1>
      <p className="mt-2 max-w-[var(--measure)] text-base text-ink-muted">{texts.lead}</p>
      <ol className="mt-10 flex flex-col gap-10">
        {levels.map(({ level, texts: step }) => (
          <LevelStep key={level} level={level} texts={step} highlighted={level === highlighted} />
        ))}
      </ol>
      <LinkButton href={backHref} variant="ghost" className="mt-8">
        {texts.back}
      </LinkButton>
    </>
  )
}
