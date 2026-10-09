import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { QUESTIONS_PATH } from '@/lib/questions/paths'

type Props = { texts: { title: string; body: string; action: string } }

// Una dirección mal escrita y una página retirada se ven igual (FR-015).
export function QuestionNotFound({ texts }: Props) {
  return (
    <HeadedEmptyState
      title={texts.title}
      body={texts.body}
      action={
        <LinkButton
          href={QUESTIONS_PATH}
          variant="tirita"
          size="lg"
          prefetch={false}
          className="md:w-auto"
        >
          {texts.action}
        </LinkButton>
      }
    />
  )
}
