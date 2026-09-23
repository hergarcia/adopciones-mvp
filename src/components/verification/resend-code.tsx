import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { NextCodeHint } from './next-code-hint'

export type ResendNote = { ok: boolean; text: string }

type Props = {
  texts: { help: string; resend: string }
  onResend: () => void
  resending: boolean
  waiting: boolean
  hint: string | null
  note: ResendNote | null
}

// Lo que respondió el reenvío va junto a su botón y no en el renglón: el código escrito no tiene
// nada de malo porque no haya salido otro.
export function ResendCode({ texts, onResend, resending, waiting, hint, note }: Props) {
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm text-ink-muted">{texts.help}</p>
      <Button variant="ghost" onClick={onResend} loading={resending} disabled={waiting}>
        {texts.resend}
      </Button>
      <NextCodeHint text={hint} />
      {note?.ok ? <output className="text-sm text-ink-muted">{note.text}</output> : null}
      {note && !note.ok ? <ErrorText announce>{note.text}</ErrorText> : null}
    </div>
  )
}
