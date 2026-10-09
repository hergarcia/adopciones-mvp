import type { BadgeLevel } from '@/lib/verification/badge-parts'
import { VerificationBadge } from './verification-badge'

export type LevelStepTexts = { title: string; asks: string; says: string; badge: string }

type Props = {
  level: BadgeLevel
  texts: LevelStepTexts
  /** El que se tocó: su chapita es la `lg`, la que la persona lleva en su perfil. */
  highlighted: boolean
  /** 3 debajo del `h2` de otra página, como en «Cómo se verifica». */
  headingLevel?: 2 | 3
}

const TAGS: readonly BadgeLevel[] = [1, 2, 3]

// Un escalón de la explicación: qué pide y qué dice de la persona (FR-024). Cada nivel incluye los
// anteriores, y el collar lo muestra: las chapitas se suman como en un collar de verdad. Desde 1024
// lo que pide y lo que dice van lado a lado, así el escalón gana ancho y no se parte en columnas.
export function LevelStep({ level, texts, highlighted, headingLevel = 2 }: Props) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2'
  return (
    <li
      aria-current={highlighted ? 'step' : undefined}
      className="grid gap-x-8 gap-y-2 md:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_1fr]"
    >
      <LevelCollar level={level} label={texts.badge} highlighted={highlighted} />
      <Heading className="afiche text-xl text-ink md:col-start-2 lg:col-span-2">
        {texts.title}
      </Heading>
      <p className="text-base text-ink md:col-start-2">{texts.asks}</p>
      <p className="text-base text-ink-muted md:col-start-2 lg:col-start-3 lg:row-start-2">
        {texts.says}
      </p>
    </li>
  )
}

// El cordón de tinta mide siempre tres chapitas: en nivel 1 sobra lugar, y eso dice que hay más.
// Las anteriores son dibujo; la del nivel lleva el nombre.
function LevelCollar({
  level,
  label,
  highlighted,
}: {
  level: BadgeLevel
  label: string
  highlighted: boolean
}) {
  return (
    <div className="mb-2 grid w-fit grid-cols-[repeat(3,calc(var(--spacing)*14))] gap-1 border-t-2 border-ink md:row-span-3 md:mb-0 lg:row-span-2">
      {TAGS.filter((tag) => tag <= level).map((tag) =>
        tag === level ? (
          <span key={tag} className="-mt-1 flex justify-center">
            <VerificationBadge
              level={tag}
              size={highlighted ? 'lg' : 'md'}
              shine={false}
              href={null}
              label={label}
            />
          </span>
        ) : (
          <span key={tag} aria-hidden className="-mt-1 flex justify-center">
            <VerificationBadge level={tag} href={null} label="" />
          </span>
        ),
      )}
    </div>
  )
}
