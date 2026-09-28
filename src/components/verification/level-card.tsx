import { cn } from '@/lib/cn'
import type { BadgeLevel } from '@/lib/verification/badge-parts'
import { VerificationBadge } from './verification-badge'

export type LevelCardTexts = { title: string; asks: string; says: string; badge: string }

type Props = {
  level: BadgeLevel
  texts: LevelCardTexts
  /** El que se tocó: va enmarcado, no de otro color. */
  highlighted: boolean
}

// Un nivel de la explicación: qué pide y qué dice de la persona (FR-024). El destacado lleva el
// borde de tinta de una nota; los otros, el mismo lugar sin borde, así no se corren al compararlos.
export function LevelCard({ level, texts, highlighted }: Props) {
  return (
    <section
      aria-current={highlighted ? 'true' : undefined}
      className={cn(
        'flex flex-col gap-3 border-2 p-4',
        highlighted ? 'border-ink bg-canvas' : 'border-transparent',
      )}
    >
      <div className="flex items-center gap-4">
        <VerificationBadge level={level} href={null} label={texts.badge} />
        <h2 className="text-lg font-bold text-ink">{texts.title}</h2>
      </div>
      <p className="text-base text-ink">{texts.asks}</p>
      <p className="text-base text-ink-muted">{texts.says}</p>
    </section>
  )
}
