import { VerificationBadge } from '@/components/verification/verification-badge'

export type AdopterPromiseTexts = {
  title: string
  sentences: readonly string[]
  /** Lo que dice la chapita en voz alta, con «Qué significa». */
  badge: string
  levelsHref: string
}

// La chapita es la del nivel 1, el que tiene todo el que publica: la misma que ven en su perfil.
export function AdopterPromise({ texts }: { texts: AdopterPromiseTexts }) {
  return (
    <section aria-labelledby="adopter-promise-title" className="max-w-[var(--measure)]">
      <h2 id="adopter-promise-title" className="afiche text-xl text-ink">
        {texts.title}
      </h2>
      <div className="mt-6 flex items-start gap-4">
        <VerificationBadge level={1} size="md" href={texts.levelsHref} label={texts.badge} />
        <div className="flex flex-col gap-2">
          {texts.sentences.map((sentence) => (
            <p key={sentence} className="text-base text-ink">
              {sentence}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
