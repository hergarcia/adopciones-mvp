import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { QuestionLinks } from './question-links'

type Link = { href: string; label: string }

export type QuestionIndexGroup = { id: string; title: string; links: Link[] }

export type QuestionIndexTexts = { title: string; lead: string; empty: string; emptyAction: Link }

type Props = {
  texts: QuestionIndexTexts
  /** Los grupos con alguna publicada, ya en su orden. */
  groups: QuestionIndexGroup[]
}

// Una lista de lectura, sin tarjetas ni tirita: no hay una acción principal, se elige una pregunta.
export function QuestionIndex({ texts, groups }: Props) {
  return (
    <>
      <h1 className="afiche text-2xl text-ink">{texts.title}</h1>
      <p className="mt-2 max-w-[var(--measure)] text-base text-ink-muted">{texts.lead}</p>
      {groups.length === 0 ? (
        <EmptyState
          className="mt-10"
          title={texts.empty}
          action={
            <LinkButton href={texts.emptyAction.href} variant="secondary">
              {texts.emptyAction.label}
            </LinkButton>
          }
        />
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-3 lg:gap-0 lg:divide-x-2 lg:divide-line">
          {groups.map((group) => (
            <section
              key={group.id}
              aria-labelledby={`grupo-${group.id}`}
              className="lg:px-8 lg:first:pl-0 lg:last:pr-0"
            >
              <h2 id={`grupo-${group.id}`} className="text-xl font-bold text-ink">
                {group.title}
              </h2>
              <QuestionLinks links={group.links} size="lg" />
            </section>
          ))}
        </div>
      )}
    </>
  )
}
