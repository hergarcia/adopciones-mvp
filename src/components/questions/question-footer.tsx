import { LinkButton } from '@/components/ui/link-button'
import { RelatedQuestions, type RelatedQuestionsTexts } from './related-questions'

export type QuestionFooterTexts = {
  updated: { label: string; day: string }
  related: RelatedQuestionsTexts
  action: { href: string; label: string }
}

// El cierre, en este orden: la fecha, las relacionadas y la única acción (FR-003). En el teléfono
// lo separa un divisor; al costado, desde 1024, el aire.
export function QuestionFooter({ texts }: { texts: QuestionFooterTexts }) {
  return (
    <div className="flex flex-col gap-6 border-t-2 border-line pt-6 lg:border-t-0 lg:pt-0">
      <p className="text-sm text-ink-muted">
        <time dateTime={texts.updated.day}>{texts.updated.label}</time>
      </p>
      <RelatedQuestions texts={texts.related} />
      <LinkButton href={texts.action.href} variant="tirita" size="lg" prefetch={false}>
        {texts.action.label}
      </LinkButton>
    </div>
  )
}
