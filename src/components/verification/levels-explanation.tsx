import { button } from '@/components/ui/button-styles'
import { OpeningLink } from '@/components/ui/opening-link'
import { textLink } from '@/components/ui/text-link'
import { cn } from '@/lib/cn'
import type { BadgeLevel } from '@/lib/verification/badge-parts'
import { LevelLadder } from './level-ladder'
import type { LevelStepTexts } from './level-step'

type Props = {
  /** Ya traducidos. */
  texts: { title: string; lead: string; back: string }
  levels: { level: BadgeLevel; texts: LevelStepTexts }[]
  /** El nivel que se tocó, o nulo desde un perfil sin nivel. */
  highlighted: BadgeLevel | null
  backHref: string
  /** «Cómo se verifica», el detalle de cómo se llega a cada escalón. */
  more: { label: string; href: string } | null
}

// La explicación de los niveles: una escalera, no tres opciones para elegir; cada escalón suma al
// anterior. Sin tirita: no hay un próximo paso, solo volver a donde se estaba. Los dos enlaces se
// apagan al tocarlos hasta que aparece lo que abren (historia #350).
export function LevelsExplanation({ texts, levels, highlighted, backHref, more }: Props) {
  return (
    <>
      <h1 className="afiche text-2xl text-ink">{texts.title}</h1>
      <p className="mt-2 max-w-[var(--measure)] text-base text-ink-muted">{texts.lead}</p>
      <LevelLadder
        levels={levels}
        highlighted={highlighted}
        className="mt-10 flex flex-col gap-10"
      />
      {more ? (
        <p className="mt-8">
          <OpeningLink href={more.href} prefetch={false} className={textLink()}>
            {more.label}
          </OpeningLink>
        </p>
      ) : null}
      <OpeningLink href={backHref} className={cn(button({ variant: 'ghost' }), 'mt-8')}>
        {texts.back}
      </OpeningLink>
    </>
  )
}
