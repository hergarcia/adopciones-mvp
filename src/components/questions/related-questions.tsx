import { TextLink } from '@/components/ui/text-link'
import { QuestionLinks } from './question-links'

type Link = { href: string; label: string }

export type RelatedQuestionsTexts = { title: string; links: Link[]; toIndex: Link }

// Sin `prefetch`: abrir el índice también se cuenta.
export function RelatedQuestions({ texts }: { texts: RelatedQuestionsTexts }) {
  if (texts.links.length === 0) {
    return (
      <TextLink href={texts.toIndex.href} prefetch={false}>
        {texts.toIndex.label}
      </TextLink>
    )
  }
  return (
    <section>
      <h2 className="text-lg font-bold text-ink">{texts.title}</h2>
      <QuestionLinks links={texts.links} />
    </section>
  )
}
