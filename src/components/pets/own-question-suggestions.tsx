import { useId } from 'react'
import { Button } from '@/components/ui/button'
import type { OwnQuestionSuggestion } from '@/lib/pets/own-question-suggestions'

export type OwnQuestionSuggestionTexts = {
  lead: string
  /** Con `{name}`: el animal o la camada donde se usó. */
  usedIn: string
}

type Props = {
  texts: OwnQuestionSuggestionTexts
  suggestions: readonly OwnQuestionSuggestion[]
  onChoose: (question: string) => void
}

export function OwnQuestionSuggestions({ texts, suggestions, onChoose }: Props) {
  const leadId = useId()
  if (suggestions.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <p id={leadId} className="text-sm text-ink-muted">
        {texts.lead}
      </p>
      <ul aria-labelledby={leadId} className="flex flex-col gap-2">
        {suggestions.map(({ question, name }) => (
          <li key={question}>
            <Button
              variant="secondary"
              size="sm"
              align="start"
              className="w-full py-2"
              onClick={() => onChoose(question)}
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="line-clamp-2 break-words">{question}</span>
                <span className="text-sm font-regular font-stretch-normal">
                  {texts.usedIn.replace('{name}', name)}
                </span>
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
