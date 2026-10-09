import type { BadgeLevel } from '@/lib/verification/badge-parts'
import { LevelStep, type LevelStepTexts } from './level-step'

type Props = {
  levels: { level: BadgeLevel; texts: LevelStepTexts }[]
  /** El nivel que se tocó, o nulo: ninguno resaltado. */
  highlighted: BadgeLevel | null
  headingLevel?: 2 | 3
  className?: string
}

// La escalera de los tres niveles, la misma en «Qué dice cada nivel» y en «Cómo se verifica».
export function LevelLadder({ levels, highlighted, headingLevel, className }: Props) {
  return (
    <ol className={className}>
      {levels.map(({ level, texts }) => (
        <LevelStep
          key={level}
          level={level}
          texts={texts}
          highlighted={level === highlighted}
          headingLevel={headingLevel}
        />
      ))}
    </ol>
  )
}
