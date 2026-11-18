'use client'

import { CountedTextarea } from '@/components/forms/counted-textarea'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { SheetClose } from '@/components/ui/sheet'
import { ANSWER_COUNTER_FROM, QUESTION_MAX_LENGTH } from '@/lib/applications/rules'
import type { AskQuestionTexts } from './ask-question-sheet'
import { ContactLaterNote } from './contact-later-note'

type Props = {
  text: string
  onText: (text: string) => void
  errors: { text?: string; form?: string }
  busy: boolean
  onSend: () => void
  texts: AskQuestionTexts
}

// Lo de adentro de la hoja de pedir más información: llega después de abrir (`deferred`).
export function AskQuestionBody({ text, onText, errors, busy, onSend, texts }: Props) {
  return (
    <div className="flex w-full flex-col gap-4">
      <CountedTextarea
        value={text}
        onChange={onText}
        label={texts.label}
        help={texts.remaining}
        error={errors.text}
        disabled={busy}
        max={QUESTION_MAX_LENGTH}
        from={ANSWER_COUNTER_FROM}
        counts={texts.counts}
        rows={3}
      />
      <ContactLaterNote text={texts.contactLater} />
      {errors.form === undefined ? null : <ErrorText announce>{errors.form}</ErrorText>}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button loading={busy} onClick={onSend}>
          {texts.confirm}
        </Button>
        <SheetClose>
          <Button variant="ghost" disabled={busy}>
            {texts.cancel}
          </Button>
        </SheetClose>
      </div>
    </div>
  )
}
