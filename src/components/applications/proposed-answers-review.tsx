import { Button } from '@/components/ui/button'
import type { QuestionId } from '@/lib/applications/questionnaire'
import { AnswerList } from './answer-list'

type Props = {
  items: { id: QuestionId; question: string; answer: string }[]
  disabled: boolean
  onRevise: (id: QuestionId) => void
  /** Ya traducidos; `changeLabel` trae `{question}` sin reemplazar. */
  texts: { title: string; change: string; changeLabel: string }
}

// Las respuestas propuestas, a la vista antes de enviar (FR-025): quien solicita por segunda vez ve
// lo que va a mandar sin recorrer diez pasos, y «Cambiar» lleva al paso de esa pregunta.
export function ProposedAnswersReview({ items, disabled, onRevise, texts }: Props) {
  const actions = Object.fromEntries(
    items.map((item) => [
      item.id,
      <Button
        key={item.id}
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        aria-label={texts.changeLabel.replace('{question}', item.question)}
        className="shrink-0"
        onClick={() => onRevise(item.id)}
      >
        {texts.change}
      </Button>,
    ]),
  )
  return <AnswerList title={texts.title} items={items} actions={actions} />
}
